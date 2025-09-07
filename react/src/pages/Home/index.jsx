import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCog } from '@fortawesome/free-solid-svg-icons';


function Home() {
    return (
        <>
        Hello
        <FontAwesomeIcon icon={faUser} size="lg" color="#fff"/>
        <FontAwesomeIcon icon={faCog} size="lg"/>
        </>
    );
};

export default Home;