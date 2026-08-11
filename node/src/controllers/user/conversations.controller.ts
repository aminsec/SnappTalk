import { Request, Response } from "express";
import { getUserConversations } from "../../services/conversations.services";
import { showError, sendResponse, whiteListConversations } from "../../utils/operations";
import { getMessageById } from "../../services/messages.services";
import { getUserInfoById } from "../../services/account.services";
import { getUnreadMessagesCount } from "../../services/messages.services";
import { Types } from "mongoose";

export async function showUserConversations(req: Request, resp: Response) {
    const { userInfo } = req;

    const [conversations, error] = await getUserConversations(userInfo);
    if (error) {
      showError(error, resp);
      return;
    }

    if (!conversations || conversations.length === 0) {
      const responseData = {state: "success", conversations: []};
      sendResponse(responseData, {}, 200, resp);
      return;
    }

    // Get the last message ID for this specific user
    const lastMessageIds = conversations.map(conv => conv.last_message_id[userInfo._id.toString()]).filter(Boolean);

    //Getting contact ids
    const contactIds = conversations.map(conv => {
        return new Types.ObjectId((conv.members[0]).toString() !== userInfo._id.toString() ? conv.members[0].toString() : conv.members[1].toString());
    });

    //Getting conversation ids
    const conversationIds = conversations.map(conv => conv._id);

    //Getting unread messages count
    const [unreadMessages, unreadError] = await getUnreadMessagesCount(userInfo._id.toString(), conversationIds);
    if (unreadError) {
      showError(unreadError, resp);
      return;
    }

    const unreadCounts = new Map(
      (unreadMessages ?? []).map(item => [item.conversation_id.toString(), item.unreadMessagesCount])
    );

    const [lastMessagesInfo, messageError] = await getMessageById(lastMessageIds);
    if (messageError) {
      showError(messageError, resp);
      return;
    }

    const [contactsInfo, err] = await getUserInfoById(contactIds);
    if (err) {
      showError(err, resp);
      return;
    }

    // O(n) lookup instead of repeatedly using .find()
    const messagesById = new Map((lastMessagesInfo ?? []).map(message => [message._id.toString(), message]));
    const contacts = new Map((contactsInfo ?? []).map(conatct => [conatct._id.toString(), conatct]));

    const conversationsWithLastMessageAndContactInfo = conversations.map(conv => {
      const messageId = conv.last_message_id[userInfo._id.toString()];
      let contactInfo = null;

      if (conv.type === "pv") {
        const contactId = conv.members.find(member => member.toString() !== userInfo._id.toString());

        if (contactId) {
          contactInfo = contacts.get(contactId.toString()) ?? null;
        }
      }

      return {
        ...conv,
        last_message: messageId
          ? messagesById.get(messageId.toString()) ?? null
          : null,
          contact_info: contactInfo,
          unread_messages_count: unreadCounts.get(conv._id.toString()) ?? 0
      };
    });

    const filterdConversations = whiteListConversations(conversationsWithLastMessageAndContactInfo)
    const responseData = {state: "success", conversations: filterdConversations};
    sendResponse(responseData, {}, 200, resp);
};
