'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Card, CardHeader, CardContent } from '../components/ui/card';

export default function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState('');

  const isAdmin = () => {
    return typeof window !== 'undefined' && localStorage.getItem('teamName') === 'admin';
  };

  useEffect(() => {
    if (!isAdmin()) {
      setMessage('Access denied. Admins only.');
      return;
    }
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      let { data: teamData } = await supabase.from('teams').select('*');
      let { data: imageData } = await supabase.from('images').select('*');

      setTeams(teamData || []);
      setImages(imageData || []);
    } catch (err) {
      setMessage('Error fetching admin data: ' + err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3>Admin Dashboard</h3>
      </CardHeader>
      <CardContent>
        <p>{message}</p>
        {isAdmin() && (
          <>
            <h4>Teams</h4>
            <ul>
              {teams.map((team) => (
                <li key={team.id}>
                  {team.team_name} — Votes: {team.votes ?? 0}
                </li>
              ))}
            </ul>
            <h4>Images</h4>
            <ul>
              {images.map((img) => (
                <li key={img.id}>
                  Team ID: {img.team_id}, URL: {img.image_url}, Displayed: {img.display_count} times
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}