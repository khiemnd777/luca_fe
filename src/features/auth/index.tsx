import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";

const AccountPage = React.lazy(() => import("@features/auth/presentation/pages/account.page"));

const mod: ModuleDescriptor = {
  id: "auth",
  routes: [
    {
      path: "/account",
      element: <AccountPage />,
    },
  ],
};

registerModule(mod);
