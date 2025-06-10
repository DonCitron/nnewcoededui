#!/bin/bash

echo "======================================"
echo "  OrdnungsHub Complete Test Suite"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track test results
ALL_PASSED=true

# 1. Python Unit Tests
echo "1. Running Python Unit Tests..."
echo "--------------------------------"
source venv/bin/activate
pytest tests/unit/test_backend.py -v
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Python unit tests passed${NC}"
else
    echo -e "${RED}❌ Python unit tests failed${NC}"
    ALL_PASSED=false
fi
echo ""

# 2. JavaScript Unit Tests
echo "2. Running JavaScript Unit Tests..."
echo "--------------------------------"
npm test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ JavaScript unit tests passed${NC}"
else
    echo -e "${RED}❌ JavaScript unit tests failed${NC}"
    ALL_PASSED=false
fi
echo ""

# 3. Integration Tests
echo "3. Running Integration Tests..."
echo "--------------------------------"
python test_app.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Integration tests passed${NC}"
else
    echo -e "${RED}❌ Integration tests failed${NC}"
    ALL_PASSED=false
fi
echo ""

# 4. Summary
echo "======================================"
echo "         TEST SUMMARY"
echo "======================================"
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo "The OrdnungsHub application is ready for development!"
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Please fix the failing tests before proceeding."
fi
echo ""