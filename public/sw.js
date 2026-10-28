self.addEventListener("push", (event) => {
  let notification = {
    title: "CaseIT workbook updated",
    body: "An admin saved changes to the event workbook.",
    url: "/admin",
  };

  if (event.data) {
    try {
      notification = { ...notification, ...event.data.json() };
    } catch (error) {
      console.error("Could not parse a CaseIT push notification.", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: "/pwa/icon-192.png",
      badge: "/pwa/icon-192.png",
      data: { url: notification.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url ?? "/admin", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => "focus" in client);
      if (existingClient) {
        return existingClient.focus().then(() => existingClient.navigate(targetUrl));
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
