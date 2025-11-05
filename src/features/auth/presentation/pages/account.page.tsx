import React from "react";
import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@root/shared/components/ui/page-container";
import { PageToolbar } from "@root/shared/components/ui/page-toolbar";
import { SectionCard } from "@root/shared/components/ui/section-card";
import { Button } from "@mui/material";
import type { AutoFormRef } from "@root/core/form/form.types";
import AccountForm from "@features/auth/components/account-form";
import AccountChangePasswordForm from "@features/auth/components/account-change-password-form";
import { AutoGrid } from "@shared/components/ui/auto-grid";

export default function AccountPage() {
  const formAccountRef = React.useRef<AutoFormRef>(null);
  const formAccountChangePasswordRef = React.useRef<AutoFormRef>(null);
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title="Tài khoản" subtitle="Chỉnh sửa thông tin tài khoản đăng nhập." />
          <AutoGrid>
            <SectionCard title={"Thông tin tài khoản"} extra={
              <Button variant="contained" onClick={() => formAccountRef.current?.submit()}>
                Lưu
              </Button>
            }>
              <AccountForm ref={formAccountRef} />
            </SectionCard>
            <SectionCard title={"Đổi mật khẩu"} extra={
              <Button variant="contained" onClick={() => formAccountChangePasswordRef.current?.submit()}>
                Đổi
              </Button>
            }>
              <AccountChangePasswordForm ref={formAccountRef} />
            </SectionCard>
          </AutoGrid>
        </PageContainer>
      </BasePage>
    </>
  );
}
