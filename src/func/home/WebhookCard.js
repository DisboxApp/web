import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import styles from "../../css/Home.module.css";
import defaultimage from "../../img/logo192.png";

function WebhookCard({ webhookUrl, onClick, onDelete }) {
  const [webhookData, setWebhookData] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!webhookUrl) {
      setHasError(true);
      return;
    }

    axios.get(webhookUrl)
    .then((response) => {
      setWebhookData(response.data);
      setHasError(false);
    })
    .catch((error) => {
      console.error("Failed to fetch webhook data:", error);
      setHasError(true);
    });
  }, [webhookUrl]);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(webhookUrl);
  };

  if (hasError || !webhookData) {
    return null;
  }

  return (
    <div className={styles.webhookCard} onClick={() => onClick(webhookData.url)}>
      <FontAwesomeIcon icon={faTrash} className={styles.deleteIcon} onClick={handleDelete}/>
      <img src={defaultimage} alt="Webhook Avatar" className={styles.webhookAvatar} />
      <p>{webhookData.name}</p>
    </div>
  );
}

export default WebhookCard;
