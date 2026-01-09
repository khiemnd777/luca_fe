import { NotificationList } from "@core/notification";
import { registerSlot } from "@root/core/module/registry";

/**
 * TODO 
 *  Add SafeButton at the  
 */

function NotificationListWidget() {
  return (
    <>
      <NotificationList />
    </>
  );
}

registerSlot({
  id: "notification",
  name: "notification:left",
  render: () => <NotificationListWidget />,
});
