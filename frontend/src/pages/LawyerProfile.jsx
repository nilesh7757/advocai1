import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { User, Mail, Phone, GraduationCap, Building, Clock, DollarSign, Check, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/Card";
import { Label } from "@/Components/ui/Label";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { Button } from "@/Components/ui/button";
import { useAuth } from "../context/AuthContext";
import ConnectModal from "../Components/ConnectModal";
import QuoteModal from "../Components/QuoteModal";

const LawyerProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsNextUrl, setReviewsNextUrl] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`api/lawyer/${id}/`);
        setProfileData(response.data);
      } catch (err) {
        console.error("Failed to load lawyer profile:", err);
        toast.error(err.response?.data?.error || "Unable to load lawyer profile.");
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const resp = await axios.get(`api/lawyer/${id}/reviews/`);
        const data = resp.data;
        setReviews(data.results || data || []);
        setReviewsNextUrl(data.next || null);
      } catch (e) {
        console.error('Failed to load reviews:', e);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) {
      fetchProfile();
      fetchReviews();
    }
  }, [id]);

  const loadMoreReviews = async () => {
    if (!reviewsNextUrl) return;
    setReviewsLoading(true);
    try {
      const resp = await axios.get(reviewsNextUrl);
      const data = resp.data;
      setReviews(prev => [...prev, ...(data.results || data || [])]);
      setReviewsNextUrl(data.next || null);
    } catch (e) {
      toast.error('Failed to load more reviews.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const openConnectModal = () => {
    setIsModalOpen(true);
  };

  const handleConnect = async ({ message, preferredContact, preferredTime }) => {
    if (!profileData?.user?.id) return;

    if (!message || !preferredContact || !preferredTime) {
      toast.error('Please fill out all fields.');
      return;
    }

    let preferredTimeIso = null;
    if (preferredTime) {
      const parsedDate = new Date(preferredTime);
      if (Number.isNaN(parsedDate.getTime())) {
        toast.error("Please provide a valid consultation time.");
        return;
      }
      preferredTimeIso = parsedDate.toISOString();
    }

    try {
      const response = await axios.post(`api/lawyer/${profileData.user.id}/connect/`, {
        message: message || "",
        preferred_contact_method: preferredContact?.includes("@") ? "email" : "phone",
        preferred_contact_value: preferredContact || user?.email || "",
        preferred_time: preferredTimeIso,
      });
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('Connection request sent!');
      }
    } catch (err) {
      console.error("Failed to connect with lawyer:", err);
      toast.error(err.response?.data?.error || "Unable to send connection request.");
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleQuote = async ({ message, preferredContact }) => {
    if (!profileData?.user?.id) return;
    try {
      const response = await axios.post(`api/lawyer/${profileData.user.id}/connect/`, {
        message: message || '',
        preferred_contact_method: preferredContact?.includes('@') ? 'email' : 'phone',
        preferred_contact_value: preferredContact || user?.email || '',
        request_type: 'quote',
      });
      toast.success(response.data.message || 'Quote request sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to send quote request.');
    } finally {
      setIsQuoteOpen(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-muted-foreground">Loading lawyer profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-destructive">Lawyer profile not found.</div>
      </div>
    );
  }

  const { user: lawyerUser } = profileData;
  const experienceYears = profileData.experience_years ?? 0;

  const ProfileDisplayField = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-all duration-200 group">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors duration-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <Label className="text-muted-foreground text-xs">{label}</Label>
        <p className="text-foreground text-sm font-medium group-hover:text-primary transition-colors duration-200 truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="container mx-auto py-10 animate-fade-in">
        <Card className="max-w-3xl mx-auto bg-card border border-border">
          <CardHeader className="text-center">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-primary text-xs font-medium">
                Lawyer Profile · {profileData.verification_status?.toUpperCase()}
              </span>
            </div>
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 border-2 border-primary/20">
              {getInitials(lawyerUser?.name || lawyerUser?.username || '')}
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mb-1">
              {lawyerUser?.name || lawyerUser?.username}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {profileData.education || profileData.specializations?.join(', ') || 'Legal Professional'}
            </CardDescription>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 select-none">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] md:text-xs font-semibold rounded-full px-2.5 py-0.5 border border-primary/20">
                <Check className="w-3 h-3 flex-shrink-0" /> Bar Council Verified
              </span>
              {Number(experienceYears) >= 10 ? (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] md:text-xs font-semibold rounded-full px-2.5 py-0.5 border border-primary/20">
                  10+ Years Experience
                </span>
              ) : Number(experienceYears) >= 5 ? (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] md:text-xs font-semibold rounded-full px-2.5 py-0.5 border border-primary/20">
                  5+ Years Experience
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button onClick={openConnectModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Connect with {lawyerUser?.name || 'Lawyer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsQuoteOpen(true)}
                className="text-foreground border-border hover:bg-card hover:border-primary/40"
              >
                Request a Quote
              </Button>

              {/* Connection Stats */}
              {(profileData.avg_response_time_hours !== null || profileData.acceptance_rate !== null) && (
                <div className="mt-4 flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground select-none">
                  {profileData.avg_response_time_hours !== null && (
                    <p className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                      Typically responds within {profileData.avg_response_time_hours} hours
                    </p>
                  )}
                  {profileData.acceptance_rate !== null && (
                    <p className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                      {profileData.acceptance_rate}% acceptance rate
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-3 flex items-center">
                <span className="w-1 h-8 bg-primary rounded-full mr-3"></span>
                Personal Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <ProfileDisplayField
                  icon={<User className="w-5 h-5" />}
                  label="Full Name"
                  value={lawyerUser?.name || 'Not provided'}
                />
                <ProfileDisplayField
                  icon={<User className="w-5 h-5" />}
                  label="User Name"
                  value={lawyerUser?.username || 'Not provided'}
                />
                <ProfileDisplayField
                  icon={<Mail className="w-5 h-5" />}
                  label="Email"
                  value={lawyerUser?.email || 'Not available'}
                />
                <ProfileDisplayField
                  icon={<Phone className="w-5 h-5" />}
                  label="Phone"
                  value={profileData.phone || lawyerUser?.phone || 'Not provided'}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-3 flex items-center">
                <span className="w-1 h-8 bg-primary rounded-full mr-3"></span>
                Professional Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <ProfileDisplayField
                  icon={<GraduationCap className="w-5 h-5" />}
                  label="Education"
                  value={profileData.education || 'Not provided'}
                />
                <ProfileDisplayField
                  icon={<Building className="w-5 h-5" />}
                  label="Law Firm"
                  value={profileData.law_firm || 'Independent'}
                />
                <ProfileDisplayField
                  icon={<Clock className="w-5 h-5" />}
                  label="Experience"
                  value={`${experienceYears} ${experienceYears === 1 ? 'year' : 'years'}`}
                />
                <ProfileDisplayField
                  icon={<DollarSign className="w-5 h-5" />}
                  label="Consultation Fee"
                  value={profileData.consultation_fee || 'Contact for details'}
                />
              </div>
              {profileData.bio && (
                <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <Label className="text-muted-foreground text-xs">About</Label>
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                    {profileData.bio}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card className="max-w-3xl mx-auto mt-6 bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-foreground text-xl flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Reviews
              </CardTitle>
              {profileData?.review_count > 0 && (
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{profileData.average_rating}</span> avg ·{' '}
                  {profileData.review_count} {profileData.review_count === 1 ? 'review' : 'reviews'}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.length === 0 && !reviewsLoading && (
              <p className="text-muted-foreground text-sm">No reviews yet.</p>
            )}
            {reviews.map((review) => (
              <div key={review.id} className="border border-border rounded-lg p-4 bg-background/30">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {review.client?.name || 'Anonymous'} ·{' '}
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.review_text && (
                  <p className="text-sm text-foreground">{review.review_text}</p>
                )}
              </div>
            ))}
            {reviewsNextUrl && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  onClick={loadMoreReviews}
                  disabled={reviewsLoading}
                  className="text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                >
                  {reviewsLoading ? 'Loading…' : 'Load More Reviews'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {profileData && (
        <ConnectModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          lawyer={profileData}
          onConnect={handleConnect}
        />
      )}
      {profileData && (
        <QuoteModal
          isOpen={isQuoteOpen}
          onOpenChange={setIsQuoteOpen}
          lawyer={profileData}
          onSubmit={handleQuote}
        />
      )}
    </>
  );
};

export default LawyerProfile;
