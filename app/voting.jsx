'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function VotingSection() {
  const [teamName, setTeamName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState('');

  // Restore teamName from localStorage if available
  useEffect(() => {
    const storedTeamName = window.localStorage.getItem('teamName');
    if (storedTeamName) {
      setTeamName(storedTeamName);
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch images if logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchImages();
    }
  }, [isLoggedIn]);

  // Simple login that stores creds locally
  const handleLogin = () => {
    if (!teamName || !username || !password) {
      setMessage('Please fill in team name, username, and password.');
      return;
    }
    localStorage.setItem('teamName', teamName);
    setIsLoggedIn(true);
    setMessage('Logged in successfully. You can now vote.');
  };

  // List images from storage bucket "uploads"
  const fetchImages = async () => {
    setMessage('');
    try {
      const numericTeam = parseInt(teamName.split('_')[1], 10) || 0;
      const { data: allFiles, error } = await supabase.storage
        .from('uploads')
        .list('', { limit: 1000 });

      if (error) {
        setMessage('Error listing images in bucket.');
        return;
      }
      if (!allFiles || allFiles.length === 0) {
        setMessage('No images in bucket.');
        return;
      }

      // Filter out current team's images and only accept proper file naming
      const validFiles = allFiles.filter((file) => {
        if (file.name.startsWith(`team_${numericTeam}_`)) return false;
        return /^team_\d+_[12]$/.test(file.name);
      });

      if (validFiles.length < 2) {
        setMessage('Not enough images available for voting.');
        return;
      }

      const shuffled = shuffle(validFiles);
      const chosen = pickTwo(shuffled);
      if (chosen.length === 2) {
        // Build public URLs for these images
        const chosenWithUrls = chosen.map((file) => {
          const { data: publicData } = supabase.storage
            .from('uploads')
            .getPublicUrl(file.name);

          return {
            fileName: file.name,
            publicUrl: publicData?.publicUrl || '',
          };
        });
        setImages(chosenWithUrls);
      } else {
        setMessage('Could not find two images from different teams.');
      }
    } catch (err) {
      setMessage(`Error loading images: ${err.message}`);
    }
  };

  // On vote, increment the voted team's column in "teams" and set the voter's column in "teamsubmit" table to true
  const castVote = async (fileName) => {
    try {
      // The voted team's number
      const votedTeamNum = parseInt(fileName.split('_')[1], 10);
      // The voting team's number
      const myTeamNum = parseInt(teamName.split('_')[1], 10);

      // 1) Add +1 to the column "team_{votedTeamNum}" in "teams" table
      await supabase
        .rpc('increment_team_column', { col_name: `team_${votedTeamNum}` });

      // 2) Mark "team_{myTeamNum}" as true in "teamsubmit" table
      await supabase
        .from('teamsubmit')
        .update({ [`team_${myTeamNum}`]: true })
        .eq('id', 1); // Adjust as needed for your DB schema

      setMessage(`Vote cast for: team_${votedTeamNum}`);
      fetchImages();
    } catch (err) {
      setMessage(`Unable to cast vote: ${err.message}`);
    }
  };

  // Shuffle array in-place
  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Pick two images from different teams
  const pickTwo = (arr) => {
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const team1 = parseInt(arr[i].name.split('_')[1], 10);
        const team2 = parseInt(arr[j].name.split('_')[1], 10);
        if (team1 !== team2) {
          return [arr[i], arr[j]];
        }
      }
    }
    return [];
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Voting Section</CardTitle>
          <CardDescription>Enter your credentials and vote on images.</CardDescription>
        </CardHeader>
        <CardContent>
          {message && <p className="text-sm text-red-600 mb-4">{message}</p>}

          {!isLoggedIn && (
            <div className="mb-6 space-y-2">
              <Input
                placeholder="team_5"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleLogin} className="bg-blue-600 text-white">
                Login
              </Button>
            </div>
          )}

          {isLoggedIn && (
            <div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-4">
                {images.map((img) => (
                  <div key={img.fileName} className="flex flex-col items-center space-y-4">
                    {img.publicUrl && (
                      <img
                        src={img.publicUrl}
                        alt={img.fileName}
                        className="w-full border border-gray-200 rounded"
                      />
                    )}
                    <Button
                      onClick={() => castVote(img.fileName)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Vote
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={fetchImages}
              >
                Fetch New Images
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
}