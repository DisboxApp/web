import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

// Configuration de base pour les toasts
toast.configure({
  autoClose: false,
  draggable: false,
  position: toast.POSITION.BOTTOM_RIGHT,
  closeOnClick: false,
});

const ProgressBarToast = ({ progressValue, message }) => (
  <div>
    <Typography style={{ margin: '10px 0' }}>{message}</Typography>
    <LinearProgress variant="determinate" value={progressValue} style={{ height: '10px', marginBottom: '10px' }} />
    <Typography style={{ marginBottom: '10px' }}>{`${progressValue}%`}</Typography>
    <IconButton
      size="small"
      onClick={() => toast.dismiss()}
      style={{ position: 'absolute', top: '5px', right: '5px' }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  </div>
);

// Fonction pour afficher un toast avec barre de progression
export const showProgressToast = (message, progressValue) => {
  toast(<ProgressBarToast progressValue={progressValue} message={message} />, {
    toastId: 'progressToast'
  });
};

// Fonction pour mettre à jour la progression
export const updateProgressToast = (progressValue, message) => {
  toast.update('progressToast', {
    render: <ProgressBarToast progressValue={progressValue} message={message} />,
    progress: progressValue / 100,
  });
};

// Fonction pour afficher un toast d'erreur
export const showErrorToast = (message) => {
  toast.error(message);
};

export const showSuccessToast = (message) => {
    toast.success(message);
  };
  

export default { showProgressToast, updateProgressToast, showErrorToast, showSuccessToast };
