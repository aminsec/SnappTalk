const { getUserInfoById } = require("../../services/account.services");
const { showError, sendResponse } = require("../../utils/operations");

async function showUserInfo(req, resp) {
    const userid = req.userInfo.id;
    console.log(userid)
    const [userInfo, error] = await getUserInfoById(userid);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", userInfo: userInfo};
    sendResponse(responseData, {}, 200, resp);
};

async function updateUserInfo(req, resp) {
    const data = {state: "success", message: "Info updated"};
    sendResponse(data, {}, 200, resp);
}

module.exports = {
    showUserInfo,
    updateUserInfo,
};