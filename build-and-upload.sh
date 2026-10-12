#!/bin/bash

# Mzansi Couriers - Automated iOS Build & Upload Script
# This script automates the build and upload process to App Store Connect

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_PATH="$HOME/path/to/mzansi-couriers/ios/App"  # UPDATE THIS PATH
SCHEME="App"
CONFIGURATION="Release"
ARCHIVE_PATH="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/App.xcarchive"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Mzansi Couriers - Build & Upload Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 1: Verify project path
echo -e "${YELLOW}Step 1: Verifying project path...${NC}"
if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}ERROR: Project path not found: $PROJECT_PATH${NC}"
    echo "Please update the PROJECT_PATH in this script to your actual project location."
    echo "Example: /Users/yourname/Downloads/mzansi-couriers/ios/App"
    exit 1
fi
echo -e "${GREEN}✓ Project found${NC}"
echo ""

# Step 2: Clean build folder
echo -e "${YELLOW}Step 2: Cleaning build folder...${NC}"
cd "$PROJECT_PATH"
xcodebuild clean -scheme "$SCHEME" -configuration "$CONFIGURATION" 2>/dev/null || true
echo -e "${GREEN}✓ Build folder cleaned${NC}"
echo ""

# Step 3: Build the project
echo -e "${YELLOW}Step 3: Building the project...${NC}"
xcodebuild build -scheme "$SCHEME" -configuration "$CONFIGURATION" -sdk iphoneos
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Step 4: Archive the app
echo -e "${YELLOW}Step 4: Creating archive...${NC}"
xcodebuild archive \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Archive created${NC}"
else
    echo -e "${RED}✗ Archive failed${NC}"
    exit 1
fi
echo ""

# Step 5: Upload to App Store Connect
echo -e "${YELLOW}Step 5: Uploading to App Store Connect...${NC}"
echo -e "${YELLOW}Note: You may need to authenticate with your Apple ID${NC}"
echo ""

xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$PROJECT_PATH/ExportOptions.plist" \
    -exportPath "$HOME/Desktop/Mzansi-Couriers-Build" \
    -allowProvisioningUpdates

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Upload successful${NC}"
else
    echo -e "${RED}✗ Upload failed${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build & Upload Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Go to App Store Connect: https://appstoreconnect.apple.com"
echo "2. Update the app icon and screenshots"
echo "3. Add review notes"
echo "4. Submit for review"
echo ""
