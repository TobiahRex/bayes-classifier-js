# bayes-classifier-js

A JavaScript library for Bayesisan classification

Initial API ideas:

```javascript
let classifier = new Classifier();

// Text to train, followed by category name
classifier.train("I am happy.", "happy");
classifier.train("I am sad and I am very sad.", "sad");
classifier.train("I have mixed feelings.", "mixed");
classifier.probabilities();

let results = classifier.guess("Yesterday, I was very very happy, so happy.");
console.log(results);
```


# classifier.js

## Overwatch
- The file looks across an infinite number of word inputs, called "docs".
- Then the model is trained across those inputs, such that, we remember every uniue word, and the category that it was associated with.

NOTE: If one were to use this type of model in a production environment, we would need to find a way to generate the categories dynamically. Since we want the most robust handling for random inputs, without any structure from the user/data supplier.

- As we look at the category first, we detect whether we've seen that category. If we have, we increment it's docCount.
-
