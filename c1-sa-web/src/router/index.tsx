import { createBrowserRouter } from "react-router-dom";
import { AuthPage } from "../pages/AuthPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DetailPage } from "../pages/DetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
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
]);