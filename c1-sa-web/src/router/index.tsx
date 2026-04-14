import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthPage } from "../pages/AuthPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DetailPage } from "../pages/DetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/aquarium/:id", // :id là tham số động
    element: <DetailPage />,
  },
  {
    path: "*", // Mọi đường dẫn không tồn tại sẽ tự động chuyển về trang chủ
    element: <Navigate to="/" replace />,
  }
]);