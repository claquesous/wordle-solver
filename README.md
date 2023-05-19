# Motivation

Wordle solver was created as an antidote to all of those articles out there about the "best starting word" according to "AI" or "Information Theory" or whatever buzz word yet none of the articles ever seem to mention the phrase "hard mode."

Most of these articles also focus on the average number of guesses to get the answer, but aren't clear on how losses are calculated. We define a loss as counting as an infinite number of guesses.

# Eight + 8

The first thing created was wordle_tri.js which recognizes that the riskiest words are n-grams that only differ by one letter. Running `node wordle_tri.js` outputs n-grams. What we discover is that the worst case n-gram is `*ight`. There are nine words including the word "eight" so we refer to this as Eight+8.

If you were to start a Wordle game with "eight" and the solution is one of the n-gram then others would define the average number of guesses as 4.5, but since there is a 1/3rd chance of a loss we define this as a "guaranteed loss". As such, the average number of guesses is infinite.

Clearly, there are 9 words in this n-gram which result in immediate guaranteed losses. There are 4 other n-grams of size 7 or more (`*atch`, `*ound`, `*ower`, and `sha*e`) for another 29 guaranteed loss starting words.

# Solving Wordle

With that in mind, we attempted to solve the true best starting words through an exhaustive search.

Partially for performance reasons, but also out of a sense of purity, we will restrict our guesses to valid answers. (Even this is incredibly complex.)

We recognize that when guessing A then B, the potential outcomes are the same when guessing B then A. (Excluding of course cases where A or B are the solution.) Rather than calculating these entire solution trees separately, we collapse them into a single node in our tree which can be reached by different paths.

We know that nodes can be collapsed by comparing their regular expressions. As a further optimization, we strip irrelevant information. For example, if we know the solution is in Eight+8 and we know the solution does not contain a 'p' then we can strip that information from the regular expression because there is no possible solution of 'pight'.

# "Quick" Start

```
npm i
node solver.js
npm run dev
```

After installing dependencies, the next command will build the solve tree which will probably take a few weeks. The frontend code can be run without building the solve tree, but drilling down into the potential outcomes will take time. Out of the box you will get a very powerful tool to help you solve Wordle puzzles.

# How to Play

Navigate to the page and then type your word. Based on your results in the real game, click the letters to indicate which outcome you received and then hit 'Enter'. You will then see the new set of possible answers which can be inspected to manually choose the best answer.
