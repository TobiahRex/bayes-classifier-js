// A2Z F17
// Daniel Shiffman
// http://shiffman.net/a2z
// https://github.com/shiffman/A2Z-F17

// An object that does classification with us of words
class Classifier {

  constructor() {

    // Word objects
    // Category counts
    // Category probabilities
    this.dict = {};
    /* NOTE: example:
      this.dict = {
        'am': {
          word: 'am'
          'happy': { count: 1 }  // also note that a word can have multiple different associated categories.
        }
      }
    }

    */

    // Each category
    // total tokens
    // total documents
    this.categories = {};
    /* NOTE: example:
      this.categories = {
        happy: {
          frequency: 1,
          tokenCount: 2,
        }
      }
    */

    // An array of just the words and categories for sorting
    // This is redundant and could probably be removed
    this.wordList = [];
    this.categoryList = [];

  }

  // A function to validate a toke
  static validate(token) {
    // For now anything that doesn't have at least
    // one word character is no good
    return /\w+/.test(token);
  }

  // Get some data to train
  train(data, category) {
    this._trainMemoizeCategory(category);
    this._trainMemoizeData(data, category);
  }

  _trainMemoizeCategory(category) {
    if (!this.categories[category]) {
      const newCategory = {
        docCount: 1, // NOTE: The total number of times this category was used for training input.
        frequency: 0 // NOTE: The number of times a word was associated with this category
      };
      this.categories[category] = newCategory;
      this.categoryList.push(category);
    } else {
      this.categories[category].docCount++;
    }
  }

  _trainMemoizeData(data, inputCategory) {
    // Split into words
    const words = data.split(/\W+/);

    // For every word
    words.forEach(word => {
      token = token.toLowerCase();
      // Make sure it's ok
      if (Classifier.validate(word)) {
        // Increment it
        // 1. Increase the word count
        this.categories[inputCategory].frequency++; // NOTE: Every time a valid word is mapped to a category, increase that categories frequency.

        const cachedWord = this.dict[word];

        // 2. Is this a new word?
        if (!cachedWord) {
          this.dict[word] = {
              word: word,
              [inputCategory]: {
                seen: 1, // NOTE: Number of times the word was seen with that category
                frequency: 0, // NOTE: the frequency of this word relative to all the words in the category
              }
            };
          // 3. Save the word to a list
          this.wordList.push(word);
        } else if (!cachedWord[inputCategory]) {
          cachedWord[inputCategory] = { seen: 1, frequency: 0 };
        } else {
          cachedWord[inputCategory].seen++;
        }
      }
    });
  }

  // Compute the probabilities
  probabilities() {
    this._probabilitiesGenerateIndividual();
    this._probablitiesGenerateBayesResult();
  }

  _probabilitiesGenerateIndividual() {
    /*
      - Iterate across all the unique words.
      - For each word, iterate across each category.
        - if the word was NOT seen in the category set, then assign the category a value of nothing.
        - If the word was seen within the category set, then,
          Calculate the words frequency by taking the number of times that word was seen associated with that category,
          and dividing it by the total number of words that were seen as a whole within that category.

    */
    this.wordList.forEach(word => {
      let cachedWord = this.dict[word];

      this.categoryList.forEach(category => {
        if (!cachedWord[category]) cachedWord[category] = { seen: 0 };

        // Average frequency per category record | e.g. How many times a word was seen with a category per training record.
        const wordFreqPerCategory = (
          cachedWord[category].seen
          / this.categories[category].frequency
        );

        cachedWord[category].frequency = wordFreqPerCategory;
      });
    });
  }

  _probablitiesGenerateBayesResult() {
    this.wordList.forEach(word => {
      let cachedWord = this.dict[word];

      // Probability via Bayes rule
      this.categoryList.forEach(category => {
        // Add frequencies together
        // Starting at 0, p is the accumulator
        const totalFreqOfWordForAllCategoriesSeen = this.categoryList.reduce((total, cat) => {
            const wordFreqPerCategory = cachedWord[cat].frequency;
            if (wordFreqPerCategory) return total + wordFreqPerCategory;

            return p;
          }, 0);


        // Constrain the probability
        // TODO: Is there a better way to handle this?
        const probability = (
          cachedWord[category].frequency // NOTE: the number of words in the category
          / totalFreqOfWordForAllCategoriesSeen // NOTE:
        );

        cachedWord[category].probability = Math.max(0.01, Math.min(0.99, probability));
      });
    });
  }

  // Now we have some data we need to guess
  guess(data) {

    // All the tokens
    let tokens = data.split(/\W+/);

    // Now let's collect all the probability data
    let words = [];

    // TODO: If a word appears more than once should I add it just once or
    // the number of times it appears?
    // let hash = {};

    tokens.forEach(token => {
      token = token.toLowerCase();
      if (Classifier.validate(token)) {
        // Collect the probability
        if (this.dict[token] !== undefined) { // && !hash[token]) {
          let word = this.dict[token];
          words.push(word);
        }
        // hash[token] = true;
      } else {
        // For an unknown word
        // We could just not include this (would be simpler)
        // Or we might decide that unknown words are likely to be a certain category?
        // word = {};
        // fill in probabilities
        // words.push(word);
      }
    });

    // Combined probabilities
    // http://www.paulgraham.com/naivebayes.html
    // Multiply the probabilities and add the results to sum
    // Starting with an empty object, product is the accumulator
    let sum = 0;
    let products = this.categoryList.reduce((product, category) => {
        product[category] = words.reduce((prob, word) => {
            // Multiply probabilities together
            return prob * word[category].prob;
          }, 1);
        sum += product[category];
        return product;
      }, {});

    // Apply formula
    let results = {};
    this.categoryList.forEach(category => {
      results[category] = {
          probability: products[category] / sum
        };
      // TODO: include the relevant words and their scores/probabilities in the results?
    });
    return results;
  }

}
