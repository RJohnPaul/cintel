'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function LoginPage() {
  const [teamNumber, setTeamNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const router = useRouter();

  // Fetch existing images for this team
  const fetchExistingImages = async (teamName) => {
    try {
      const { data: images, error } = await supabase
        .from('images')
        .select('*')
        .eq('team_name', teamName);

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      setExistingImages(images || []);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchExistingImages(`team_${teamNumber}`);
    }
  }, [isLoggedIn, teamNumber]);

  const handleLogin = async () => {
    try {
      if (!teamNumber || !username || !password) {
        alert('Please fill in all fields.');
        return;
      }

      const teamLoginColumn = `team_${teamNumber}_login`;
      const teamPassColumn = `team_${teamNumber}_pass`;

      let { data: teamCreds, error } = await supabase
        .from('teamcreds')
        .select(`${teamLoginColumn}, ${teamPassColumn}`)
        .single();

      if (error || !teamCreds) {
        alert('Team not found');
        return;
      }

      if (username !== teamCreds[teamLoginColumn] || password !== teamCreds[teamPassColumn]) {
        alert('Invalid username or password');
        return;
      }

      localStorage.setItem('teamName', `team_${teamNumber}`);
      setIsLoggedIn(true);
      alert('Login successful!');

      // Fetch images once logged in
      const teamName = `team_${teamNumber}`;
      await fetchExistingImages(teamName);
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const teamName = `team_${teamNumber}`;

      // Delete existing images before re-upload (if any)
      if (existingImages.length > 0) {
        for (const img of existingImages) {
          await supabase.storage.from('uploads').remove([img.image_url]);
        }
        await supabase.from('images').delete().eq('team_name', teamName);
      }

      // Upload new images
      if (image1) {
        const { error: uploadError1 } = await supabase.storage
          .from('uploads')
          .upload(`${teamName}_1`, image1);

        if (uploadError1) {
          alert('Failed to upload first image.');
          return;
        }
      }

      if (image2) {
        const { error: uploadError2 } = await supabase.storage
          .from('uploads')
          .upload(`${teamName}_2`, image2);

        if (uploadError2) {
          alert('Failed to upload second image.');
          return;
        }
      }

      // Store image info in DB
      const imagesToInsert = [];
      if (image1) {
        imagesToInsert.push({ team_name: teamName, image_url: `${teamName}_1`, team_id: parseInt(teamNumber), display_count: 0 });
      }
      if (image2) {
        imagesToInsert.push({ team_name: teamName, image_url: `${teamName}_2`, team_id: parseInt(teamNumber), display_count: 0 });
      }

      if (imagesToInsert.length > 0) {
        const { error: insertError } = await supabase.from('images').insert(imagesToInsert);

        if (insertError) {
          alert('Failed to record uploads in database: ' + insertError.message);
          return;
        }
      }

      alert('Images uploaded successfully!');
      await fetchExistingImages(teamName);
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete all images at once
  const handleDeleteAll = async () => {
    try {
      const teamName = `team_${teamNumber}`;
      if (existingImages.length > 0) {
        for (const img of existingImages) {
          await supabase.storage.from('uploads').remove([img.image_url]);
        }
        await supabase.from('images').delete().eq('team_name', teamName);
      }
      setExistingImages([]);
      alert('All images deleted successfully!');
    } catch (err) {
      alert('Failed to delete images: ' + err.message);
    }
  };

  // Delete a single image
  const handleDeleteSingle = async (imageUrl) => {
    try {
      const teamName = `team_${teamNumber}`;
      // Remove the file from storage
      await supabase.storage.from('uploads').remove([imageUrl]);

      // Remove from DB
      await supabase.from('images').delete().eq('image_url', imageUrl);

      alert(`Deleted ${imageUrl} successfully!`);
      await fetchExistingImages(teamName);
    } catch (err) {
      alert('Failed to delete image: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 shadow-lg rounded-lg">
      {/* Step 1: Team Login */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full">1</div>
          <h2 className="ml-4 text-xl font-bold">Team Login</h2>
        </div>
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Login</CardTitle>
            <CardDescription>Enter your team number, username, and password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Team Number"
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </CardContent>
          <CardFooter className="flex justify-end mt-4">
            <Button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
              Login
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Step 2: Upload Images (shown only after login) */}
      {isLoggedIn && (
        <div className="fade-in">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-full">2</div>
            <h2 className="ml-4 text-xl font-bold">Upload Images</h2>
          </div>
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Upload</CardTitle>
              <CardDescription>Upload two images for your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload fields */}
              <div>
                <label className="block text-sm font-medium mb-1">Image 1</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage1(e.target.files[0])}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image 2</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage2(e.target.files[0])}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Show existing images, each with a delete button */}
              {existingImages.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-medium">Existing Images:</h3>
                  {existingImages.map((img) => (
                    <div key={img.image_url} className="flex items-center space-x-3">
                      <span className="text-gray-700">{img.image_url}</span>
                      <Button
                        onClick={() => handleDeleteSingle(img.image_url)}
                        className="bg-red-600 text-white py-1 px-2 rounded-md hover:bg-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={handleDeleteAll}
                    className="bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700"
                  >
                    Delete All Images
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end mt-4">
              <Button
                onClick={handleUpload}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Images'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}