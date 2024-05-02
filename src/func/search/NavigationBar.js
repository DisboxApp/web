import { Link } from "react-router-dom";
import { Nav, Offcanvas, Button } from "react-bootstrap";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "../../css/NavigationBar.module.css";
import ThemeSwitch from "../theme/ThemeSwitch";
import Wave from "react-wavify";
import { filesize } from 'filesize';

function NavigationBar({ theme, setTheme, totalStorageSize }) {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // function formatSize(bytes) {
  //   if (bytes === 0) return "0 Go";

  //   const k = 1024;
  //   const dm = 2; // Nombre de chiffres après la virgule
  //   const sizes = ["octets", "Ko", "Mo", "Go", "To"];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));

  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  // }

  function formatSize(bytes) {
    if (bytes === 0) return "0 Go";
    return filesize(bytes, { base: 2 });
  }

  return (
    <>
      <Button
        variant="outline-primary"
        onClick={handleShow}
        className={styles.navbtn}
      >
        <FontAwesomeIcon icon={faBars} size="lg" />
      </Button>

      <Offcanvas show={show} onHide={handleClose} placement="start">
        <Offcanvas.Header
          style={{
            backgroundColor: "#121212",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Offcanvas.Title style={{ fontSize: "1.3rem" }}>
            Disbox
          </Offcanvas.Title>
          <Button
            variant="link"
            onClick={handleClose}
            style={{
              color: "#fff",
              textDecoration: "none",
              padding: "0.5rem",
              marginLeft: "auto",
            }}
          >
            <FontAwesomeIcon icon={faXmark} size="lg" />
          </Button>
        </Offcanvas.Header>
        <Offcanvas.Body
          style={{
            backgroundColor: "#121212",
            color: "#fff",
            fontSize: "12px",
            position: "relative",
          }}
        >
          <Nav
            className="justify-content-between"
            style={{
              flexWrap: "nowrap",
              borderBottom: "1px solid #333",
              paddingBottom: "15px",
            }}
          >
            <Nav.Link as={Link} to="/home" onClick={handleClose}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/setup" onClick={handleClose}>
              Setup
            </Nav.Link>
            <Nav.Link
              href="https://github.com/DisboxApp/web"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
            >
              Source code
            </Nav.Link>
            <Nav.Link
              href="https://github.com/DisboxApp/web/issues"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
            >
              Report problems
            </Nav.Link>
          </Nav>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "250px",
            }}
          >
            <div
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "#E0F7FA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wave
                fill="url(#gradient)"
                paused={false}
                style={{
                  position: "relative",
                  bottom: "-15%",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
                options={{
                  height: 20,
                  amplitude: 35,
                  speed: 0.15,
                  points: 3,
                }}
              >
                <defs>
                  <linearGradient id="gradient" gradientTransform="rotate(90)">
                    <stop offset="10%" stopColor="#40acda" />
                    <stop offset="90%" stopColor="#203281" />
                  </linearGradient>
                </defs>
              </Wave>
            </div>
            <h6 style={{ color: "#fff", marginTop: "10px" }}>
              You have stored: {formatSize(totalStorageSize)}
            </h6>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "90%",
              borderTop: "1px solid #333",
              paddingTop: "15px",
            }}
          >
            <ThemeSwitch theme={theme} setTheme={setTheme} />
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default NavigationBar;
