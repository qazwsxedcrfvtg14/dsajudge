#include "testlib.h"
#include <string>
#include <vector>
#include <sstream>

using namespace std;

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

        if (j == "" && ans.eof())
          break;
        
        std::string p = ouf.readString();
        strAnswer = p;

        n++;

        if (!compareWords(j, p))
            quitf(_wa, "%d%s lines differ - expected: '%s', found: '%s'", n, englishEnding(n).c_str(), compress(j).c_str(), compress(p).c_str());
    }
    
    if (n == 1)
        quitf(_ok, "single line: '%s'", compress(strAnswer).c_str());
    
    quitf(_ok, "%d lines", n);
}
