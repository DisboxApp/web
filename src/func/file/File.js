import { LinearProgress, linearProgressClasses, styled } from "@mui/material";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import styles from "../../css/app.module.css";
import { downloadFromAttachmentUrls } from "./disbox-file-manager.js";
import { formatSize, pickLocationAsWritable } from "./file-utils.js";
import NavigationBar from "../search/NavigationBar.js";
import pako from "pako";
import { useLocation } from "react-router-dom";

const BorderLinearProgress = styled(LinearProgress)(() => ({
  height: 20,
  borderRadius: 5,
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
  },
}));

function File() {
  const [searchParams] = useSearchParams();
  const [progressValue, setProgressValue] = useState(-1);
  const [currentlyDownloading, setCurrentlyDownloading] = useState(false);
  const locationData = useLocation();

  const onProgress = (value, total) => {
    const percentage = Number(Math.round((value / total) * 100).toFixed(0));
    setProgressValue(percentage);
    if (percentage === 100) {
      setTimeout(() => {
        setCurrentlyDownloading(false);
        setProgressValue(0);
      }, 1500);
    }
  };

  async function download() {
    const fileName = searchParams.get("name");
    let attachmentUrlsArray;

    if (searchParams.get("attachmentUrls")) {
      let base64AttachmentUrls = searchParams.get("attachmentUrls");
      base64AttachmentUrls = base64AttachmentUrls
        .replace(/~/g, "+")
        .replace(/_/g, "/")
        .replace(/-/g, "=");
      attachmentUrlsArray = JSON.parse(atob(base64AttachmentUrls));
    } else {
      const base64AttachmentUrls = atob(
        locationData.hash
          .replace(/~/g, "+")
          .replace(/_/g, "/")
          .replace(/-/g, "=")
          .replace(/#/g, "")
      );
      const u8Array = new Uint8Array(base64AttachmentUrls.length);
      for (let i = 0; i < base64AttachmentUrls.length; i++) {
        u8Array[i] = base64AttachmentUrls.charCodeAt(i);
      }

      try {
        const attachmentUrls = pako.inflate(new Uint8Array(u8Array), {
          to: "string",
        });
        attachmentUrlsArray = JSON.parse(attachmentUrls);
      } catch (error) {
        console.log(error);
        throw error;
      }
    }

    try {
      const writable = await pickLocationAsWritable(fileName);
      setCurrentlyDownloading(true);
      setProgressValue(0);
      await downloadFromAttachmentUrls(
        attachmentUrlsArray,
        writable,
        onProgress,
        searchParams.get("size")
      );
    } catch (error) {
      console.log(error);
      throw error;
      // Handle the download error
    }
  }

  return searchParams.get("name") !== null &&
    (searchParams.get("attachmentUrls") !== null || locationData.hash !== "") &&
    searchParams.get("size") !== null ? (
    <div>
      <Helmet>
        <title>{searchParams.get("name")}</title>
        <meta name="description" content="Shared from Disbox" />
      </Helmet>
      <NavigationBar />
      <div className={styles.App + " " + styles["App-header"]}>
        <div className={styles["file-container"]}>
          <div className={styles["file-info"]}>
            <h1 className={styles["file-name"]}>
              <b>{searchParams.get("name")}</b>
            </h1>
            <h1 className={styles["file-size"]}>
              <b>{formatSize(searchParams.get("size"))}</b>
            </h1>
            <Button
              type="submit"
              variant="primary"
              disabled={currentlyDownloading}
              onClick={download}
              className={styles["download-button"]}
            >
              <b>Download</b>
            </Button>
            {currentlyDownloading && (
              <BorderLinearProgress
                variant="determinate"
                value={progressValue}
                className={styles["progress-bar"]}
              />
            )}
            {!currentlyDownloading && progressValue !== -1 && (
              <h1 className={styles["complete-message"]}>
                <b>Download complete.</b>
              </h1>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div
      className={
        styles.App + " " + styles["App-header"] + " " + styles["error-message"]
      }
    >
      <h1>
        <b>Oops, something went wrong.</b>
      </h1>
    </div>
  );
}

export default File;
