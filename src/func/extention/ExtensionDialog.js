/*global chrome*/
import React, { useEffect, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const EXTENSION_URL = "https://chrome.google.com/webstore/detail/disboxdownloader/jklpfhklkhbfgeencifbmkoiaokeieah";

var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);


export default function ExtensionDialog() {
    const [showExtensionDialog, setShowExtensionDialog] = useState(false);

    useEffect(() => {
        try {
            chrome.runtime.sendMessage("jklpfhklkhbfgeencifbmkoiaokeieah", { message: {} }, response => {
                if (!response || !response.installed) {
                    setShowExtensionDialog(true);
                }
            });
        } catch {
            setShowExtensionDialog(true);
        }
    }, []);

    return (<Dialog open={showExtensionDialog} onClose={() => { setShowExtensionDialog(false) }}>
        <DialogTitle>Downloads may be slow</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Disbox recommends using {!isChrome && "Google Chrome with"} the official Disbox Chrome extension for
                better download speeds and increased security.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => { setShowExtensionDialog(false) }}>Remind me later</Button>
            <Button variant="contained" onClick={() => {
                setShowExtensionDialog(false);
                window.open(EXTENSION_URL, "_blank").focus();
            }} >Install</Button>
        </DialogActions>
    </Dialog>
    );
}