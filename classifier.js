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
    // total tokens (total characters)
    // total documents (total entries to be analyzed/saved)
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

  /**
   * @function _trainMemoizeData
   * catalogue the given sentence by word. Map every word to the input category in the global "dict".
   * Insert each word into the global word list.
   * Update the number of times this word was seen with the input category.
   * Update the number of times this word was seen relative to all the words in the category.
   * @param
   * @return
   */
  _trainMemoizeData(data, inputCategory) {
    // Split into words
    const words = data.split(/\W+/);

    // For every word
    words.forEach(word => {
      word = word.toLowerCase();
      // Make sure it's ok
      if (Classifier.validate(word)) {
        this.categories[inputCategory].words++;

        const cachedWord = this.dict[word];

        // 2. Is this a new word?
        if (!cachedWord) {
          this.dict[word] = {
            word: word,
            [inputCategory]: {
              seen: 1, // NOTE: Number of times the word was seen with that category
              frequency: 0 // NOTE: the frequency of this word relative to all the words in the category
            }
          };
          // 3. Save the word to a list
          this.wordList.push(word);
        } else if (!cachedWord[inputCategory]) {
          cachedWord[inputCategory] = {
            seen: 1,
            frequency: 0,
          };
        } else {
          cachedWord[inputCategory].seen++;
        }
      }
    });
  }

  /**
   * @function _trainMemoizeCategory
   * Create a new category if one doesn't already exist.
   *
   * @param
   * @return
   */
  _trainMemoizeCategory(category) {
    if (!this.categories[category]) {
      const newCategory = {
        docCount: 1, // NOTE: The total number of times this category was used for training input.
        frequency: 0 // NOTE: The number of times a word was associated with this category
      };
      this.categories[category] = newCategory;
      this.categoryList.push(category);
    } else {
      this.categories[category].docCount++; // docCount = the number of sentence associated with this category
    }
  }

  // Compute the probabilities
  probabilities() {
    this._probabilitiesGenerateIndividual();
    this._probablitiesGenerateBayesResult();
  }

  /**
   * @function _probabilitiesGenerateIndividual
   * Iterate across all the unique words.
   * For each word, iterate across each category O(n*n)
   *    if the word was NOT seen in the category set, then assign the category a value of nothing.
   *    If the word was seen within the category set, then,
   *      Calculate the words frequency by taking the number of times that word was seen associated with that category,
   *      and dividing it by the total number of input sentences that were seen in that category.
   *      Assign the result to the global dictionary, under the word's category.frequency value.
   *
   * Gives -> P(word, Category) | Probability of word in Category
   * @param
   * @return
   */
  _probabilitiesGenerateIndividual() {
    this.wordList.forEach(word => {
      let cachedWord = this.dict[word];

      this.categoryList.forEach(category => {
        if (!cachedWord[category]) cachedWord[category] = { seen: 0 }; // Adds all non paired words/categories with eachother for a count of 0

        // NOTE: Effective result is the number of words that exist for each respective input.
        const wordFreqPerCategoryDoc =
          cachedWord[category].seen / this.categories[category].docCount; // NOTE: The total number of words seen in the category

        cachedWord[category].frequency = wordFreqPerCategoryDoc;
      });
    });
  }

  _probablitiesGenerateBayesResult() {
    this.wordList.forEach(word => {
      let cachedWord = this.dict[word];

      // Probability via Bayes rule
      this.categoryList.forEach(category => {
        // Add frequencies together
        // Starting at 0, "total" is the accumulator
        const totalWordFreqForAllCategories = this.categoryList.reduce((total, cat) => {
          const wordFreqPerCategoryDoc = cachedWord[cat].frequency; // The frequency of the word with this category (calculated in previous step)
          if (wordFreqPerCategoryDoc) {
            return total + wordFreqPerCategoryDoc; // add this categories frequency to global total for this word.
          }

          return total;
        }, 0);

        // Constrain the probability
        // TODO: Is there a better way to handle this?
        const probability =
          cachedWord[category].frequency / totalWordFreqForAllCategories; // NOTE: the frequency of the word per category document // NOTE:

        cachedWord[category].probability = Math.max(
          0.01,
          Math.min(0.99, probability)
        );
      });
    });
  }

  // Now we have some data we need to guess
  guess(data) {
    // All the tokens
    const words = data.split(/\W+/);

    // Now let's collect all the probability data
    let cachedWords = [];

    // TODO: If a word appears more than once should I add it just once or
    // the number of times it appears?
    // let hash = {};

    words.forEach(word => {
      word = word.toLowerCase();
      if (Classifier.validate(word)) {
        // Collect the probability
        if (this.dict[word]) cachedWords.push(this.dict[word]);
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
    const products = this.categoryList.reduce((result, category) => {
      result[category] = cachedWords.reduce((totalProb, cachedWord) => {
        // Multiply probabilities together
        return totalProb * cachedWord[category].probability;
      }, 1);
      sum += result[category];
      return result;
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
