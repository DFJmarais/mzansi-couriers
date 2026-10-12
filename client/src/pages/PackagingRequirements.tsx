import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Info, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocation } from 'wouter';

interface DeclarationItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ExpandableSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
  expanded: boolean;
}

export default function PackagingRequirements() {
  const [, setLocation] = useLocation();
  const [declarations, setDeclarations] = useState<DeclarationItem[]>([
    { id: 'secure', label: 'My parcel is securely packaged.', checked: false },
    { id: 'protected', label: 'The contents are properly protected.', checked: false },
    { id: 'sealed', label: 'My parcel is sealed.', checked: false },
    { id: 'code', label: 'My unique Parcel Identification Code is attached clearly to the outside.', checked: false },
    { id: 'match', label: 'The code matches my booking.', checked: false },
    { id: 'prohibited', label: 'My parcel contains no prohibited items.', checked: false },
    { id: 'dimensions', label: 'The declared weight and dimensions are accurate.', checked: false },
    { id: 'policy', label: 'I accept the Mzansi Couriers Packaging Policy.', checked: false },
  ]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    code: true,
    general: false,
    boxes: false,
    fragile: false,
    liquids: false,
    electronics: false,
    documents: false,
    clothing: false,
    food: false,
    prohibited: false,
    faq: false,
  });

  const completedDeclarations = declarations.filter(d => d.checked).length;
  const allDeclarationsAccepted = completedDeclarations === declarations.length;
  const progressPercentage = (completedDeclarations / declarations.length) * 100;

  const toggleDeclaration = (id: string) => {
    setDeclarations(declarations.map(d =>
      d.id === id ? { ...d, checked: !d.checked } : d
    ));
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const ExpandableCard = ({ id, title, icon, color, children }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    children: React.ReactNode;
  }) => (
    <div className="border border-border rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => toggleSection(id)}
        className={`w-full px-4 py-3 flex items-center justify-between ${color} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <ChevronDown
          size={20}
          className={`transition-transform ${expandedSections[id] ? 'rotate-180' : ''}`}
        />
      </button>
      {expandedSections[id] && (
        <div className="px-4 py-3 bg-background text-sm text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a5f3f] to-[#2d8659] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Button type="button" variant="outline" onClick={() => setLocation('/customer/send-package')} className="mb-4 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" />Back to booking</Button>
          <div className="flex items-center gap-3 mb-3">
            <Package size={32} />
            <h1 className="text-3xl font-bold">Packaging Requirements</h1>
          </div>
          <p className="text-green-100">Ensure your parcel is ready for safe transport</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Introduction Card */}
        <Card className="border-l-4 border-l-[#ff9500] bg-[#fff8f0] p-4">
          <div className="flex gap-3">
            <Info className="text-[#ff9500] flex-shrink-0 mt-1" size={20} />
            <div>
              <h2 className="font-semibold text-foreground mb-1">Important</h2>
              <p className="text-sm text-muted-foreground">
                Before booking a courier, every parcel must be packaged correctly. The sender is responsible for ensuring that the parcel is securely packaged before collection. Improperly packaged parcels may be refused for collection.
              </p>
            </div>
          </div>
        </Card>

        {/* Parcel Identification Code Section */}
        <ExpandableCard
          id="code"
          title="Parcel Identification Code (MANDATORY)"
          icon={<CheckCircle className="text-green-600" size={20} />}
          color="bg-green-50 border-b border-green-200"
        >
          <div className="space-y-3">
            <p>Every booking automatically generates a unique Mzansi Couriers Parcel Identification Code. This code is used to identify and track your parcel throughout its journey.</p>
            <p className="font-semibold">The sender MUST clearly write, print, or securely attach this unique code to the outside of the parcel before collection.</p>
            <div className="bg-white border border-green-200 rounded p-3 space-y-2">
              <p className="font-semibold text-sm">The code must:</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Be clearly visible</li>
                <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Be easy to read</li>
                <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Not be covered by tape</li>
                <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Not be placed over folds or edges</li>
                <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Remain visible throughout transport</li>
              </ul>
            </div>
            <p className="text-sm text-red-600 font-semibold">Parcels without the correct identification code may be refused.</p>
          </div>
        </ExpandableCard>

        {/* General Packaging Rules */}
        <ExpandableCard
          id="general"
          title="General Packaging Rules"
          icon={<CheckCircle className="text-green-600" size={20} />}
          color="bg-green-50 border-b border-green-200"
        >
          <div className="bg-white border border-green-200 rounded p-3 space-y-2">
            <p className="font-semibold text-sm mb-2">Your parcel must:</p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Be securely packaged</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Be completely sealed</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Protect its contents</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Prevent items from moving inside</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Withstand multiple loading and unloading events</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Withstand transfers between different couriers</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Be suitable for stacking with other parcels</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Be clean and dry</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✔</span> Display the Parcel Identification Code clearly</li>
            </ul>
          </div>
        </ExpandableCard>

        {/* Packaging Categories */}
        <ExpandableCard
          id="boxes"
          title="Boxes"
          icon={<Package className="text-blue-600" size={20} />}
          color="bg-blue-50 border-b border-blue-200"
        >
          <div className="space-y-2 text-sm">
            <ul className="space-y-1">
              <li>• Use strong, undamaged boxes</li>
              <li>• Do not use crushed or weakened boxes</li>
              <li>• Fill empty spaces with protective material</li>
              <li>• Tape every seam securely</li>
              <li>• Remove all previous courier labels and barcodes</li>
            </ul>
          </div>
        </ExpandableCard>

        <ExpandableCard
          id="fragile"
          title="Fragile Items"
          icon={<AlertCircle className="text-orange-600" size={20} />}
          color="bg-orange-50 border-b border-orange-200"
        >
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Fragile items must:</p>
            <ul className="space-y-1">
              <li>• Be individually wrapped</li>
              <li>• Use bubble wrap, foam or protective cushioning</li>
              <li>• Have no movement inside the box</li>
              <li>• Have cushioning on every side</li>
              <li>• Be clearly marked "FRAGILE"</li>
            </ul>
          </div>
        </ExpandableCard>

        <ExpandableCard
          id="liquids"
          title="Liquids"
          icon={<AlertCircle className="text-red-600" size={20} />}
          color="bg-red-50 border-b border-red-200"
        >
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Liquids must:</p>
            <ul className="space-y-1">
              <li>• Be tightly sealed</li>
              <li>• Be placed inside a leak-proof bag</li>
              <li>• Be wrapped with absorbent material</li>
              <li>• Be packed inside a rigid outer box</li>
            </ul>
            <p className="text-red-600 font-semibold">Leaking parcels will not be accepted.</p>
          </div>
        </ExpandableCard>

        <ExpandableCard
          id="electronics"
          title="Electronics"
          icon={<Package className="text-purple-600" size={20} />}
          color="bg-purple-50 border-b border-purple-200"
        >
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Electronics should:</p>
            <ul className="space-y-1">
              <li>• Be switched off</li>
              <li>• Be wrapped in protective material</li>
              <li>• Be packed inside rigid boxes</li>
              <li>• Be protected against movement</li>
            </ul>
            <p className="mt-2">Original manufacturer packaging is recommended whenever possible.</p>
          </div>
        </ExpandableCard>

        <ExpandableCard
          id="documents"
          title="Documents"
          icon={<Package className="text-indigo-600" size={20} />}
          color="bg-indigo-50 border-b border-indigo-200"
        >
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Documents should be packed inside:</p>
            <ul className="space-y-1">
              <li>• Courier envelopes</li>
              <li>or</li>
              <li>• Waterproof document sleeves</li>
            </ul>
            <p className="mt-2">Avoid folding important documents.</p>
          </div>
        </ExpandableCard>

        <ExpandableCard
          id="clothing"
          title="Clothing"
          icon={<Package className="text-cyan-600" size={20} />}
          color="bg-cyan-50 border-b border-cyan-200"
        >
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Clothing should be packed inside:</p>
            <ul className="space-y-1">
              <li>• Waterproof courier bags</li>
              <li>or</li>
              <li>• Strong plastic packaging</li>
            </ul>
            <p className="mt-2">Seal securely.</p>
          </div>
        </ExpandableCard>

        <ExpandableCard
          id="food"
          title="Food"
          icon={<Package className="text-amber-600" size={20} />}
          color="bg-amber-50 border-b border-amber-200"
        >
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Only sealed, non-perishable food items may be transported.</p>
            <p className="font-semibold mt-2">Food must:</p>
            <ul className="space-y-1">
              <li>• Be hygienically packaged</li>
              <li>• Not leak</li>
              <li>• Not smell excessively</li>
              <li>• Not require refrigeration unless Mzansi Couriers introduces a dedicated temperature-controlled service</li>
            </ul>
          </div>
        </ExpandableCard>

        {/* Prohibited Items */}
        <ExpandableCard
          id="prohibited"
          title="Prohibited Items"
          icon={<AlertCircle className="text-red-600" size={20} />}
          color="bg-red-50 border-b border-red-200"
        >
          <div className="space-y-2 text-sm">
            <p className="font-semibold mb-2">The following items are prohibited:</p>
            <div className="bg-white border border-red-200 rounded p-3 space-y-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Illegal substances</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Firearms</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Ammunition</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Explosives</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Hazardous chemicals</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Flammable materials</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Gas cylinders</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Toxic substances</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Live animals</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Human remains</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Counterfeit goods</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Stolen property</div>
                <div className="flex items-center gap-2"><span className="text-red-600 text-lg">❌</span> Any item prohibited under SA law</div>
              </div>
            </div>
            <p className="text-red-600 font-semibold mt-3">The sender must confirm that none of these items are included.</p>
          </div>
        </ExpandableCard>

        {/* Weight & Size */}
        <Card className="border-l-4 border-l-[#ff9500] bg-[#fff8f0] p-4">
          <div className="flex gap-3">
            <Info className="text-[#ff9500] flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Weight & Size</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The sender must accurately enter weight, length, width, and height. The courier will verify that the parcel reasonably matches the declared information.
              </p>
              <p className="text-sm text-red-600 font-semibold">Incorrect declarations may result in additional charges or refusal of collection.</p>
            </div>
          </div>
        </Card>

        {/* FAQ Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Frequently Asked Questions</h2>
          
          <ExpandableCard
            id="faq-code"
            title="Why do I need a Parcel Identification Code?"
            icon={<Info className="text-blue-600" size={20} />}
            color="bg-blue-50 border-b border-blue-200"
          >
            <p className="text-sm">The unique Parcel Identification Code allows every courier in the Mzansi Couriers network to instantly identify, verify, scan, and track your parcel from collection to final delivery.</p>
          </ExpandableCard>

          <ExpandableCard
            id="faq-placement"
            title="Where should I place the code?"
            icon={<Info className="text-blue-600" size={20} />}
            color="bg-blue-50 border-b border-blue-200"
          >
            <p className="text-sm">Attach or write it clearly on the largest, flattest side of the parcel where it remains visible throughout transport.</p>
          </ExpandableCard>

          <ExpandableCard
            id="faq-forget"
            title="What happens if I forget the code?"
            icon={<Info className="text-blue-600" size={20} />}
            color="bg-blue-50 border-b border-blue-200"
          >
            <p className="text-sm">The courier may refuse collection until the parcel is correctly labelled.</p>
          </ExpandableCard>

          <ExpandableCard
            id="faq-package"
            title="Can the courier package my parcel?"
            icon={<Info className="text-blue-600" size={20} />}
            color="bg-blue-50 border-b border-blue-200"
          >
            <p className="text-sm">No. Packaging remains the sender's responsibility unless an optional Packaging Service is selected.</p>
          </ExpandableCard>

          <ExpandableCard
            id="faq-reuse"
            title="Can I reuse boxes?"
            icon={<Info className="text-blue-600" size={20} />}
            color="bg-blue-50 border-b border-blue-200"
          >
            <p className="text-sm">Yes, provided they are clean, strong, undamaged, and all previous labels have been removed.</p>
          </ExpandableCard>

          <ExpandableCard
            id="faq-fragile"
            title="Can I send fragile items?"
            icon={<Info className="text-blue-600" size={20} />}
            color="bg-blue-50 border-b border-blue-200"
          >
            <p className="text-sm">Yes, provided they are packaged according to the fragile item requirements.</p>
          </ExpandableCard>
        </div>

        {/* Sender Declaration Checklist */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Sender Declaration</h2>
          
          <Card className="p-6 border-2 border-[#1a5f3f]">
            <div className="space-y-4 mb-6">
              <p className="text-sm font-semibold text-foreground">Before booking, please confirm the following:</p>
              
              {declarations.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={() => toggleDeclaration(item.id)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={item.id}
                    className="text-sm cursor-pointer flex-1 leading-relaxed"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-foreground">Completion</span>
                <span className="text-sm text-muted-foreground">{completedDeclarations}/{declarations.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#1a5f3f] to-[#2d8659] h-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Liability Notice */}
            <Card className="bg-red-50 border border-red-200 p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-semibold text-sm text-red-900 mb-1">Liability Notice</h4>
                  <p className="text-xs text-red-800">
                    Mzansi Couriers is not responsible for damage resulting from poor packaging, incorrect packing, loose contents, insufficient protection, failure to follow packaging requirements, or missing/incorrect Parcel Identification Codes. The sender accepts full responsibility for packaging and correctly identifying the parcel before collection.
                  </p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation('/customer/send-package')}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#1a5f3f] to-[#2d8659] hover:from-[#0f4a2f] hover:to-[#1f6a47] text-white"
                disabled={!allDeclarationsAccepted}
                onClick={() => {
                  if (allDeclarationsAccepted) {
                    localStorage.setItem('packagingRequirementsAccepted', 'true');
                    localStorage.setItem('packagingRequirementsAcceptedAt', new Date().toISOString());
                    setLocation('/customer/send-package');
                  }
                }}
              >
                {allDeclarationsAccepted ? 'Proceed to Booking' : 'Complete All Items'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer Info */}
        <Card className="bg-muted p-4 text-center">
          <p className="text-xs text-muted-foreground">
            By proceeding, you confirm that you have read and understood the Mzansi Couriers Packaging Policy.
          </p>
        </Card>
      </div>
    </div>
  );
}
