import { Navbar, Nav, NavItem, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NavigationBar() {
    return (
        <Navbar bg="dark" variant="dark" className="font">
            <Container>
                <Navbar.Brand as={Link} to=""><b style={{ fontSize: "1.3rem" }}>Disbox</b></Navbar.Brand>
                <Navbar.Collapse>
                    <Nav className="me-auto">
                        <NavItem eventkey={1} href="/home">
                            <Nav.Link as={Link} to="/home" >Home</Nav.Link>
                        </NavItem>
                        <NavItem eventkey={1} href="/setup">
                            <Nav.Link as={Link} to="/setup" >Setup</Nav.Link>
                        </NavItem>
                    </Nav>
                    <Nav className="ml-auto">
                        <NavItem eventkey={1} href="/setup">
                            <Nav.Link href="https://github.com/DisboxApp/web/issues" target="_blank" rel="noopener noreferrer">Report problems</Nav.Link>
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>

            </Container>
        </Navbar>
    );
}

export default NavigationBar;
