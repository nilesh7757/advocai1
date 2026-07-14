import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/button";
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ConnectModal from '../Components/ConnectModal';
import { Search, Check } from 'lucide-react';
import { Input } from '../Components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Components/ui/Select';

const LawyerConnect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('any');
  const [allSpecializations, setAllSpecializations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const response = await axios.get('api/lawyer/');
        const lawyersData = response.data || [];
        setLawyers(lawyersData);
        setFilteredLawyers(lawyersData);
        
        const specializations = new Set();
        lawyersData.forEach(lawyer => {
          if (lawyer.specializations && Array.isArray(lawyer.specializations)) {
            lawyer.specializations.forEach(spec => specializations.add(spec));
          }
        });
        setAllSpecializations(Array.from(specializations).sort());
      } catch (err) {
        console.error('Failed to load lawyers:', err);
        setError('Failed to load lawyers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  useEffect(() => {
    let temp = lawyers;
    
    // 1. Specialization Filter
    if (selectedSpecialization) {
      temp = temp.filter(lawyer => 
        lawyer.specializations && 
        Array.isArray(lawyer.specializations) &&
        lawyer.specializations.some(spec => 
          spec.toLowerCase().includes(selectedSpecialization.toLowerCase())
        )
      );
    }
    
    // 2. Text Search Filter
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      temp = temp.filter(lawyer => {
        const name = (lawyer.user?.name || '').toLowerCase();
        const username = (lawyer.user?.username || '').toLowerCase();
        return name.includes(query) || username.includes(query);
      });
    }
    
    // 3. Experience Range Filter
    if (selectedExperience && selectedExperience !== 'any') {
      temp = temp.filter(lawyer => {
        const exp = Number(lawyer.experience_years);
        if (Number.isNaN(exp)) return false;
        
        if (selectedExperience === '0-3') {
          return exp >= 0 && exp <= 3;
        } else if (selectedExperience === '3-7') {
          return exp >= 3 && exp <= 7;
        } else if (selectedExperience === '7+') {
          return exp >= 7;
        }
        return true;
      });
    }

    /* 
      TODO: Add consultation fee range filter once consultation_fee field 
      in backend/authentication/models.py is updated to a numeric field 
      from its current free-text StringField format.
    */

    setFilteredLawyers(temp);
  }, [selectedSpecialization, searchText, selectedExperience, lawyers]);

  const openConnectModal = (lawyer) => {
    setSelectedLawyer(lawyer);
    setIsModalOpen(true);
  };

  const handleConnect = async ({ message, preferredContact, preferredTime }) => {
    if (!selectedLawyer?.user?.id) return;

    if (!message || !preferredContact || !preferredTime) {
      toast.error('Please fill out all fields.');
      return;
    }

    let preferredTimeIso = null;
    if (preferredTime) {
      const parsedDate = new Date(preferredTime);
      if (Number.isNaN(parsedDate.getTime())) {
        toast.error('Please provide a valid consultation time.');
        return;
      }
      preferredTimeIso = parsedDate.toISOString();
    }

    try {
      const response = await axios.post(`api/lawyer/${selectedLawyer.user.id}/connect/`, {
        message: message || '',
        preferred_contact_method: preferredContact?.includes('@') ? 'email' : 'phone',
        preferred_contact_value: preferredContact || user?.email || '',
        preferred_time: preferredTimeIso,
      });

      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('Connection request sent!');
      }
    } catch (err) {
      console.error('Failed to connect with lawyer:', err);
      toast.error(err.response?.data?.error || 'Unable to send connection request.');
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleViewProfile = (lawyerId) => {
    navigate(`/lawyer-profile/${lawyerId}`);
  };

  return (
    <>
      <div className="container mx-auto py-10 animate-fade-in">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-primary text-xs font-medium">Legal Professionals</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Lawyer Connect
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with qualified lawyers for your legal needs
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card border border-border p-4 rounded-xl shadow-sm select-none">
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by lawyer name or username..."
              className="pl-9 h-10 border-border/80 focus:border-primary"
            />
          </div>

          <div className="w-full md:w-56">
            <Select
              value={selectedSpecialization || "all"}
              onValueChange={(val) => setSelectedSpecialization(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-10 border-border/80">
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {allSpecializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Select
              value={selectedExperience || "any"}
              onValueChange={setSelectedExperience}
            >
              <SelectTrigger className="h-10 border-border/80">
                <SelectValue placeholder="Any Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Experience</SelectItem>
                <SelectItem value="0-3">0-3 years</SelectItem>
                <SelectItem value="3-7">3-7 years</SelectItem>
                <SelectItem value="7+">7+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 
            TODO: Add consultation fee range filter once consultation_fee field 
            in backend/authentication/models.py is updated to a numeric field 
            from its current free-text StringField format.
          */}
        </div>

        {/* Lawyers Grid */}
        {loading && (
          <div className="text-center text-gray-400">Loading vetted lawyers...</div>
        )}
        {error && (
          <div className="text-center text-red-400">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {!loading && !error && filteredLawyers.length === 0 && (
            <div className="col-span-full text-center text-gray-400">
              {selectedSpecialization 
                ? `No lawyers found with specialization "${selectedSpecialization}".`
                : 'No verified lawyers are available yet. Please check back soon.'}
            </div>
          )}
          {filteredLawyers.map((lawyer, index) => (
            <Card
              key={lawyer.id || lawyer.user?.id || index}
              className="bg-card backdrop-blur-sm border-border hover:border-primary/60 transition-all duration-200 p-5 flex flex-col group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="flex flex-col items-center text-center p-0 mb-4">
                {/* Profile Photo Placeholder */}
                <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center mb-3 group-hover:border-primary/50 transition-all duration-200">
                  <span className="text-primary font-semibold text-base">
                    {lawyer?.user?.name
                      ? lawyer.user.name.split(' ').map(n => n[0]).join('')
                      : lawyer?.user?.username?.slice(0, 2)?.toUpperCase() || 'L'}
                  </span>
                </div>
                <CardTitle className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-200">
                  {lawyer?.user?.name || lawyer?.user?.username || 'Verified Lawyer'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                  {Array.isArray(lawyer.specializations) && lawyer.specializations.length > 0
                    ? lawyer.specializations.join(', ')
                    : 'General Practice'}
                </CardDescription>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1 mt-2.5 select-none">
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-full px-2 py-0.5 border border-primary/20">
                    <Check className="w-2.5 h-2.5 flex-shrink-0" /> Bar Council Verified
                  </span>
                  {Number(lawyer.experience_years) >= 10 ? (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-full px-2 py-0.5 border border-primary/20">
                      10+ Years Exp
                    </span>
                  ) : Number(lawyer.experience_years) >= 5 ? (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-full px-2 py-0.5 border border-primary/20">
                      5+ Years Exp
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-0 mt-auto space-y-3 text-sm text-muted-foreground">
                <div className="flex flex-col gap-1">
                  {typeof lawyer.experience_years === 'number' && (
                    <p>
                      <span className="text-muted-foreground/80">Experience:</span>{' '}
                      {lawyer.experience_years} {lawyer.experience_years === 1 ? 'year' : 'years'}
                    </p>
                  )}
                  {lawyer.consultation_fee && (
                    <p>
                      <span className="text-muted-foreground/80">Consultation:</span> {lawyer.consultation_fee}
                    </p>
                  )}
                  {lawyer.education && (
                    <p>
                      <span className="text-muted-foreground/80">Education:</span> {lawyer.education}
                    </p>
                  )}
                </div>
                {/* View Profile Button */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleViewProfile(lawyer?.user?.id || lawyer.id)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 text-sm"
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openConnectModal(lawyer)}
                    className="w-full text-primary border-primary/40 hover:bg-primary/10 hover:text-primary/90 transition-colors duration-200 text-sm"
                  >
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Section (Optional) */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            className="text-muted-foreground border-border hover:bg-card hover:border-primary/60 hover:text-foreground transition-all duration-200"
          >
            Load More Lawyers
          </Button>
        </div>
      </div>
      {selectedLawyer && (
        <ConnectModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          lawyer={selectedLawyer}
          onConnect={handleConnect}
        />
      )}
    </>
  );
};

export default LawyerConnect;