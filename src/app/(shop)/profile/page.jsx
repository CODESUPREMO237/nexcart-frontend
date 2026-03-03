'use client'

import { useState } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
}

export default function ProfilePage() {
  const { isLoading, isAuthorized } = useRequireAuth()
  const { user } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const mergedFormData = {
    firstName: formData.firstName || user?.first_name || '',
    lastName: formData.lastName || user?.last_name || '',
    phone: formData.phone || user?.phone || '',
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zipCode: formData.zipCode,
    country: formData.country,
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // TODO: Add API call to update user profile when backend endpoint is ready
      // await api.updateProfile(mergedFormData)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile')
    }
  }

  if (isLoading || !isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <div className="md:col-span-2">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {user?.email}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Member since {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Auth
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        value={mergedFormData.firstName}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        name="lastName"
                        value={mergedFormData.lastName}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      className="pl-10"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed here. Use account settings.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={mergedFormData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={!editing}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={mergedFormData.address}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={mergedFormData.city}
                          onChange={handleInputChange}
                          disabled={!editing}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Region</Label>
                        <Input
                          id="state"
                          name="state"
                          value={mergedFormData.state}
                          onChange={handleInputChange}
                          disabled={!editing}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">Postal Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={mergedFormData.zipCode}
                          onChange={handleInputChange}
                          disabled={!editing}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={mergedFormData.country}
                          onChange={handleInputChange}
                          disabled={!editing}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {editing ? (
                    <>
                      <Button type="submit">Save Changes</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(false)
                          setFormData(EMPTY_FORM)
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
