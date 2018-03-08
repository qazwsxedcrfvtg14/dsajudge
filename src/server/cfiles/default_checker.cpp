#pragma GCC optimize("unroll-loops","omit-frame-pointer","inline","no-stack-protector")
#pragma GCC target "tune=native"
#include "testlib.h"
#include <string>
#include <vector>
#include <sstream>

using namespace std;
// trim from start (in place)
static inline void ltrim(std::string &s) {
	s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](int ch) {
		return !std::isspace(ch);
	}));
}
// trim from end (in place)
static inline void rtrim(std::string &s) {
	s.erase(std::find_if(s.rbegin(), s.rend(), [](int ch) {
		return !std::isspace(ch);
    }).base(), s.end());
}
// trim from both ends (in place)
static inline void trim(std::string &s) {
	ltrim(s);
	rtrim(s);
}

bool compareWords(string a, string b)
{
    stringstream sa, sb;
    sa << a;
    sb << b;
    string ca, cb;
    
    while (true) {
        bool oka = !!(sa >> ca), okb = !!(sb >> cb);
        if (oka != okb) return false;
        if (!oka) return true;
        if (oka && ca != cb) return false; 
    }
    return false;
}

int main(int argc, char * argv[])
{
    setName("compare files as sequence of tokens in lines");
    registerTestlibCmd(argc, argv);

    std::string strAnswer;

    int n = 0;
    while (!ans.eof()) 
    {
        std::string j = ans.readString();

        //if (j == "" && ans.eof())
        //  break;
        
        std::string p = ouf.readString();
        //strAnswer = p;

		rtrim(j);
		rtrim(p);

		if (j=="" && ans.eof()){
			if( p=="" ){
				p = ouf.readString();
				if( p=="" && ouf.eof() )
					break;
			}
			quitf(_wa, "%d%s lines differ - eof", n, englishEnding(n).c_str());
		}
        n++;

        //if (!compareWords(j, p))
		//trim(j);
		//trim(p);
		if(j!=p)
            quitf(_wa, "%d%s lines differ - expected: '%s', found: '%s'", n, englishEnding(n).c_str(), compress(j).c_str(), compress(p).c_str());
    }
    
    if (n == 1)
        quitf(_ok, "single line: '%s'", compress(strAnswer).c_str());
    
    quitf(_ok, "%d lines", n);
}
