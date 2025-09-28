import React from "react";
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import ManageTours from '../pages/ManageTours';
import ManageActivities from '../pages/ManageActivities';
import ManageOrders from '../pages/ManageOrders';
import ManageLanguages from '../pages/ManageLanguages';
import ManageCategories from '../pages/ManageCategories';
import ManageCurrencies from '../pages/ManageCurrencies';
import ManageDestinations from '../pages/ManagePanel';
import ManageIncluded from '../pages/ManageIncluded';
import ManageExcluded from '../pages/ManageExcluded';
import ManageTickets from '../pages/ManageTickets';
import ManageContacts from '../pages/ManageContacts';
import ManageHeroes from '../pages/ManageHeroes';
import ManageAbout from '../pages/ManageAbout';
import ManageSpeakingGuides from '../pages/ManageSpeakingGuides';
import ManageGallery from '../pages/ManageGallery';
import ProtectedRoute from '../components/ProtectedRoute';
import ManageVouchers from '../pages/ManageVouchers';
import ManageReports from '../pages/ManageReports';
import ManageBankSwift from '../pages/ManageBankSwift';
import ManagePaymentSettings from '../pages/ManagePaymentSettings';

const AdminRoutes = ({ BACKEND_URL }) => (
  <Routes>
    <Route
      path="dashboard"
      element={
        <ProtectedRoute roles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="tours"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageTours />
        </ProtectedRoute>
      }
    />
    <Route
      path="activities"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageActivities />
        </ProtectedRoute>
      }
    />
    <Route
      path="orders"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageOrders />
        </ProtectedRoute>
      }
    />
    <Route
      path="languages"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageLanguages />
        </ProtectedRoute>
      }
    />
    <Route
      path="categories"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageCategories />
        </ProtectedRoute>
      }
    />
    <Route
      path="currencies"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageCurrencies />
        </ProtectedRoute>
      }
    />
    <Route
      path="destinations"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageDestinations />
        </ProtectedRoute>
      }
    />
    <Route
      path="included"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageIncluded />
        </ProtectedRoute>
      }
    />
    <Route
      path="excluded"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageExcluded />
        </ProtectedRoute>
      }
    />
    <Route
      path="tickets"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageTickets />
        </ProtectedRoute>
      }
    />
    <Route
      path="contacts"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageContacts />
        </ProtectedRoute>
      }
    />
    <Route
      path="heroes"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageHeroes />
        </ProtectedRoute>
      }
    />
    <Route
      path="about"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageAbout />
        </ProtectedRoute>
      }
    />
    <Route
      path="speaking-guides"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageSpeakingGuides />
        </ProtectedRoute>
      }
    />
    <Route
      path="speaking-guides/edit/:id"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageSpeakingGuides />
        </ProtectedRoute>
      }
    />
    <Route
      path="gallery"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageGallery BACKEND_URL={BACKEND_URL} />
        </ProtectedRoute>
      }
    />
    <Route
      path="voucher"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageVouchers BACKEND_URL={BACKEND_URL} />
        </ProtectedRoute>
      }
    />
    <Route
      path="reports"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageReports BACKEND_URL={BACKEND_URL} />
        </ProtectedRoute>
      }
    />
    <Route
      path="bankswift"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManageBankSwift BACKEND_URL={BACKEND_URL} />
        </ProtectedRoute>
      }
    />
    <Route
      path="payment-settings"
      element={
        <ProtectedRoute roles={['admin']}>
          <ManagePaymentSettings BACKEND_URL={BACKEND_URL} />
        </ProtectedRoute>
      }
    />
  </Routes>
  
  
);

export default AdminRoutes;
