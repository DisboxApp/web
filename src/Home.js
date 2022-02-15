import logo from './logo.svg';
import './App.css';
import { Button, Card } from "react-bootstrap";
// import { useRecoilState } from 'recoil';
// import { webhookUrlState, disboxFileManagerState } from './atoms';
import { useNavigate } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import { MdOutlineSpeed, MdMoneyOff, MdLockOutline } from 'react-icons/md';
import { IoInfiniteSharp } from 'react-icons/io5';
import { BiLogIn } from "react-icons/bi";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{height:"100%"}}>
      <NavigationBar />
      <div className="App App-header">
        <div style={{ width: "100%", backgroundColor: "#2F3136" }}>
          <h1 style={{ fontSize: "6rem" }} className="mt-3">
            <b>Disbox</b>
          </h1>
          <h1 style={{ fontSize: "2.5rem" }} className="">
            Free, fast, unlimited cloud storage.
          </h1>
          <div className='m-5'>
            <Button style={{ fontSize: "2.5rem" }} variant="primary" onClick={() => { navigate("/setup") }}><b>Start using</b></Button>
            <Button className="m-2" style={{ fontSize: "2.5rem" }} variant="secondary" onClick={() => { window.open("https://github.com/DisboxApp/web")}}><b>Find out more</b></Button>
          </div>
        </div>

        <div style={{ textAlign: "left", backgroundColor: "#FFFFFF", width: "100%", display: "flex", justifyContent: "center" }}>
          <Card bg="dark" style={{ width: '18rem', height: '24rem' }} className="m-2 mt-5">
            <Card.Header><MdMoneyOff/> Free</Card.Header>
            <Card.Body>
              <Card.Text style={{ fontSize: "1.1rem" }}>
                As free as it gets. No ads, no subscriptions, and no fees. All of our features are free to use, forever.
              </Card.Text>
            </Card.Body>
          </Card>
          <Card bg="dark" style={{ width: '18rem', height: '24rem' }} className="m-2 mt-5">
            <Card.Header><MdOutlineSpeed/> Fast</Card.Header>
            <Card.Body>
              <Card.Text style={{ fontSize: "1.1rem" }}>
                Extremely high upload and download speeds and fast load times. Upload files of any size, and download them instantly.
              </Card.Text>
            </Card.Body>
          </Card>
          <Card bg="dark" style={{ width: '18rem', height: '24rem' }} className="m-2 mt-5">
            <Card.Header><IoInfiniteSharp style={{marginBottom:"0.4rem"}}/> Unlimited</Card.Header>
            <Card.Body>
              <Card.Text style={{ fontSize: "1.1rem" }}>
                No limits. Upload as many files as you want with no storage limit. Movies, music, images, backups, everything.

              </Card.Text>
            </Card.Body>
          </Card>
          <Card bg="dark" style={{ width: '18rem', height: '24rem' }} className="m-2 mt-5">
            <Card.Header><BiLogIn style={{marginRight:"0.4rem"}}/>Simple</Card.Header>
            <Card.Body>
              <Card.Text style={{ fontSize: "1.1rem" }}>
                Just a discord account required. No email, no registration, no passwords, everything is tied to your Discord account.
                Just a few steps to get started.
              </Card.Text>
            </Card.Body>
          </Card>
          <Card bg="dark" style={{ width: '18rem', height: '24rem' }} className="m-2 mt-5">
            <Card.Header><MdLockOutline/> Secure</Card.Header>
            <Card.Body>
              <Card.Text style={{ fontSize: "1.1rem" }}>
                All your files are stored on Discord's servers, and we have no access to them -
                we only store file metadata. Everything is open source and available on GitHub.
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Home;
