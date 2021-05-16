function mathQuestion(mathExpression) {
  return {
    type: 'text',
    name: mathExpression,
    title: `${mathExpression} = `,
    titleLocation: 'left',
    hideNumber: true,
    inputType: 'number',
    isRequired: true,
    validators: [
      {
        type: 'expression',
        text: `${mathExpression} = `,
        expression: `{${mathExpression}} == MyMathExpressionEvaluator('${mathExpression}') `,
      },
    ],
  };
}

const surveyJSON = {
  pages: [
    {
      name: 'page1',
      title: '你好，元元',
      elements: null,
    },
  ],
  showTitle: false,
};

const mathsPool = ['5 + 4', '4 + 5', '9 - 5', '9 - 4'];
const elementsCacheByMath = (() => {
  const elementsCache = {};
  mathsPool.forEach((math) => {
    elementsCache[math] = mathQuestion(math);
  });
  return elementsCache;
})();

let chooseFirstItemAt = -1;

export default function genSurveyJSON(max) {
  chooseFirstItemAt =
    chooseFirstItemAt === mathsPool.length - 1 ? 0 : chooseFirstItemAt + 1;
  // console.log(chooseFirstItemAt)
  const selectedMaths = mathsPool
    .slice(chooseFirstItemAt)
    .concat(mathsPool.slice(0, chooseFirstItemAt))
    .slice(0, max);
  // console.log(selectedMaths)
  surveyJSON.pages[0].elements = selectedMaths
    .map((math) => {
      return elementsCacheByMath[math];
    })
    .sort(() => 0.5 - Math.random()); // shuffle. this way is inefficient and strongly biased
  return surveyJSON;
}
