// Phase 2 Features: Regional Pricing, Payment Methods, Language, Notifications

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, CreditCard, Bell, MapPin } from 'lucide-react';
import { useLocalization } from '@/contexts/LocalizationContext';

// ============ REGIONAL PRICING SELECTOR ============
export const RegionalPricingSelector = ({ onZoneSelect }: { onZoneSelect: (zone: string) => void }) => {
  const [selectedZone, setSelectedZone] = useState('johannesburg');
  
  const zones = [
    { id: 'johannesburg', name: 'Johannesburg', region: 'Gauteng', basePrice: 2.50 },
    { id: 'capetown', name: 'Cape Town', region: 'Western Cape', basePrice: 2.75 },
    { id: 'durban', name: 'Durban', region: 'KwaZulu-Natal', basePrice: 2.50 },
    { id: 'pretoria', name: 'Pretoria', region: 'Gauteng', basePrice: 2.50 }
  ];

  const handleZoneChange = (zone: string) => {
    setSelectedZone(zone);
    onZoneSelect(zone);
  };

  return (
    <Card className="border-accent/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent" />
          Delivery Zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedZone} onValueChange={handleZoneChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zones.map(zone => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name} ({zone.region}) - R{zone.basePrice}/km
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

// ============ PAYMENT METHODS MANAGER ============
export const PaymentMethodsManager = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'eft', name: 'Standard Bank EFT', isDefault: true },
    { id: 2, type: 'capitec', name: 'Capitec Bank', isDefault: false }
  ]);
  const [showAddMethod, setShowAddMethod] = useState(false);

  const paymentTypes = [
    { value: 'eft', label: 'EFT Transfer' },
    { value: 'capitec', label: 'Capitec Bank' },
    { value: 'card', label: 'Debit/Credit Card' },
    { value: 'wallet', label: 'Mzansi Wallet' }
  ];

  return (
    <Card className="border-accent/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-accent" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.map(method => (
          <div key={method.id} className="flex items-center justify-between p-3 rounded-lg border border-input hover:border-accent/50 transition-colors">
            <div>
              <p className="font-medium">{method.name}</p>
              <p className="text-xs text-muted-foreground">{method.type.toUpperCase()}</p>
            </div>
            {method.isDefault && (
              <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full">Default</span>
            )}
          </div>
        ))}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowAddMethod(!showAddMethod)}
        >
          + Add Payment Method
        </Button>
      </CardContent>
    </Card>
  );
};

// ============ LANGUAGE SWITCHER ============
export const LanguageSwitcher = ({ currentLanguage, onLanguageChange }: { currentLanguage?: string; onLanguageChange?: (lang: string) => void } = {}) => {
  const { language, setLanguage } = useLocalization();
  const lang = currentLanguage || language;
  const onChange = onLanguageChange || setLanguage;

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
    { code: 'xh', name: 'isiXhosa', flag: '🇿🇦' }
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={lang} onValueChange={onChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map(lang => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// ============ NOTIFICATION PREFERENCES ============
export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    inApp: true,
    sms: true,
    whatsapp: true,
    phone: '+27...',
    whatsappNumber: '+27...'
  });

  return (
    <Card className="border-accent/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {[
            { key: 'inApp', label: 'In-App Notifications' },
            { key: 'sms', label: 'SMS Updates' },
            { key: 'whatsapp', label: 'WhatsApp Messages' }
          ].map(pref => (
            <label key={pref.key} className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={preferences[pref.key as keyof typeof preferences] as boolean}
                onChange={(e) => setPreferences({...preferences, [pref.key]: e.target.checked})}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm font-medium">{pref.label}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============ TRANSLATIONS ============
export const translations = {
  en: {
    deliveryZone: 'Delivery Zone',
    paymentMethods: 'Payment Methods',
    language: 'Language',
    notifications: 'Notifications',
    bookDelivery: 'Book a Delivery',
    sendPackage: 'Send a Package - Lekker & Fast',
    priceEstimate: 'Price Estimate',
    confirmDelivery: 'Confirm Delivery',
    jobFeed: 'Available Jobs',
    earnings: 'Your Earnings',
    adminDashboard: 'Mzansi Control Center',
    deliveryMonitor: 'Live Delivery Monitor'
  },
  zu: {
    deliveryZone: 'Indawo Yokuphakela',
    paymentMethods: 'Izindlela Zokukhokha',
    language: 'Ulimi',
    notifications: 'Izaziso',
    bookDelivery: 'Bhukela Ukuphakela',
    sendPackage: 'Thumela Iphakheji - Lekker & Mabilis',
    priceEstimate: 'Izilinganiso Zentengo',
    confirmDelivery: 'Qinisekeza Ukuphakela',
    jobFeed: 'Imisebenzi Etholakele',
    earnings: 'Izinzuzo Zakho',
    adminDashboard: 'Iziko Lokubhala Mzansi',
    deliveryMonitor: 'Umlalazi Wokuphakela Okusheshayo'
  },
  xh: {
    deliveryZone: 'Indawo Yokuphakela',
    paymentMethods: 'Iindlela Zokukhokha',
    language: 'Ulwimi',
    notifications: 'Izaziso',
    bookDelivery: 'Bhukela Ukuphakela',
    sendPackage: 'Thumela Iphakheji - Lekker & Mabilis',
    priceEstimate: 'Izilinganiso Zentengo',
    confirmDelivery: 'Qinisekeza Ukuphakela',
    jobFeed: 'Imisebenzi Etholakele',
    earnings: 'Izinzuzo Zakho',
    adminDashboard: 'Iziko Lokubhala Mzansi',
    deliveryMonitor: 'Umlalazi Wokuphakela Okusheshayo'
  }
};
