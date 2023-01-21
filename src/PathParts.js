import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
        

function PathPart(props) {
    return <div>
        <Button onClick={() => props.showDirectory(props.path)}>{`${props.name} >`}</Button>
    </div>
}

export default function PathParts(props) {
    const [partComponents, setPartComponents] = useState([]);

    useEffect(() => {
        async function f() {
            if (!props.fileManager) {
                return;
            }
            const parts = [];
            if (props.path !== null) {
                if (props.path !== "") {
                    parts.push(<PathPart fileManager={props.fileManager} path={props.path}
                        name={await props.fileManager.getFile(props.path).name} showDirectory={props.showDirectory} />);
                }
                let parent = await props.fileManager.getParent(props.path);
                while (parent && "path" in parent) {
                    parts.push(<PathPart fileManager={props.fileManager} path={parent.path} name={parent.name} showDirectory={props.showDirectory} />);
                    parent = await props.fileManager.getParent(parent.path);
                }
            }
            parts.push(<PathPart fileManager={props.fileManager} path={""} name={"Storage"} showDirectory={props.showDirectory} />);
            setPartComponents(parts.reverse());

        }
        f();
    }, [props.path]);

    return <div style={{ display: "flex" }}>
        {partComponents.map((component, index) => (
            <React.Fragment key={index}>
                {component}
            </React.Fragment>
        ))}
    </div>
}
