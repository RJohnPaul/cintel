'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

import VotingSection from './voting';
import AdminDashboard from './admin';
import LoginPage from './login';
// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main Home component
export default function Home() {
  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-center">Team Portal</h1>
      <LoginPage />
      <VotingSection />
      <AdminDashboard />
      <ToastContainer />
    </div>
  );
}