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
let surveyJSON;
export default surveyJSON = {
  pages: [
    {
      name: 'page1',
      title: '你好，元元',
      elements: [mathQuestion('5 + 4'), mathQuestion('4 + 5')],
    },
  ],
  showTitle: false,
};
