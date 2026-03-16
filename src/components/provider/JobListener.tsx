import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useJobAlerts } from "../../hooks/useJobAlerts";
import { JobAlertModal } from "./JobAlertModal";

interface Props {
  children: ReactNode;
}

export function JobListener({ children }: Props) {
  const { user } = useAuth();
  const { currentAlert, accepting, acceptError, acceptJob, declineJob, dismissAlert } =
    useJobAlerts(user?.id);

  return (
    <>
      {children}
      {currentAlert && (
        <JobAlertModal
          jobId={currentAlert.job_id}
          category={currentAlert.category}
          accepting={accepting}
          acceptError={acceptError}
          onAccept={acceptJob}
          onDecline={declineJob}
          onDismiss={dismissAlert}
        />
      )}
    </>
  );
}
