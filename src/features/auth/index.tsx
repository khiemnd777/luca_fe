import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";

// const AccountPage = React.lazy(() => import("@features/auth/presentation/pages/account.page"));

const mod: ModuleDescriptor = {
  id: "auth",
  routes: [
    {
      key: "auth",
      title: "Tài khoản",
      subtitle: "Chỉnh sửa thông tin tài khoản đăng nhập.",
      path: "/account",
      hidden: true,
    },
  ],
};

registerModule(mod);
