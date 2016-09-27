Description
-----------

($30\%$) Again there’s a new game about Pokemon: <span>*Pokemon
Tower*</span>!

This game is very different from traditional series of Pokemon games. It
consists of $N$ levels, and you must go from level $1$ through level
$N$, and collect many Pokemons during that. After level $N$, there is a
final boss battle.

Initially you have only one Pokemon: Pikachu! In each level there are
several battles, and after winning all of them, you can choose a new
Pokemon, or get 100 as reward. Paticularly, for level $k$, there are a
specific set $S_k$ of Pokemons to choose, and you can take <span>**at
most one**</span> from them. Also, it’s impossible to obtain the same
Pokemon in different levels, that is, if $i \neq j$, then
$S_i \cap S_j = \emptyset$. Also it’s impossible to get a second
Pikachu.

There are many strategy for this game. To win the final battle, you can
collect as many Pokemons, or only choose several Pokemons and use money
to train them to legend levels. So we may wonder that: How many ways can
you choose Pokemons throughout the game?

Let me solve this for you: if the number of candidate pokemons in level
$k$ is $p_k = |S_k|$, then the answer is just:
$$(p_1 + 1)(p_2 + 1) \cdots (p_N + 1)$$

So easy, right? Now there’s a harder problem for you: How many ways can
you choose Pokemons, if you want <span>**exactly**</span> $K$ Pokemons
in the end? Please calculate it for all $K$ with $0 \leq K \leq N+1$.

Input Format
------------

The first line contains an integer $T$ indicating the total number of
test cases, then $T$ test cases follows.

For each test case, the first line contains one integer $N$. The second
line contains $N$ integers, the $i$-th integer $p_i$ is the number of
choosable Pokemons in level $i$.

-   $1 \le T \le 5$

-   $1 \le N \le 100\,000$

-   $1 \le p_i \le 10^9$

-   First 2 test files satisfy $N \le 10, p_i \le 2$

-   First 4 test files satisfy $N \le 2\,000$

-   Test files 5-7 satisfy $p_i \le 2$

-   First 10 test files satisfy $T \le 2$

Output Format
-------------

For each test case, please output $N+2$ space-seperated integers in a
line. Those integers are $A\_0, A\_1, \cdots, A\_{N+1}$ respectively, and
$A\_K$ is the number of ways to get exactly $K$ Pokemons in the end. As
the answer can be very large, you should output the answer mod
$1\,000\,000\,007$.

Sample Input
------------

    4
    2
    2 3
    4
    1 1 1 1
    10
    1 2 3 4 5 6 7 8 9 10
    9
    314 159 265 358 979 323 846 264 338

Sample Output
-------------

    0 1 5 6
    0 1 4 6 4 1
    0 1 55 1320 18150 157773 902055 3416930 8409500 12753576 10628640 3628800
    0 1 3846 6253512 666024911 437594513 124517822 64385960 584066593 90504701 846406502

Hint
----

-   In the first sample: there’s $1$ way to choose nothing, $2$ ways to
    choose only from level 1, $3$ ways to choose only from level 2, and
    $6$ ways to choose from both levels.

-   Don’t forget your Pikachu!


