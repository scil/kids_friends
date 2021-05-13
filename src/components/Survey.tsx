import React from 'react';
import * as Survey from 'survey-react';
import mathExpressionEvaluator from 'math-expression-evaluator/dist/browser/math-expression-evaluator';

import 'survey-react/survey.css'; // default theme
// import 'survey-react/modern.min.css'; // modern theme
import './Survey.global.css';
import surveyJSON from './Survey.data';

Survey.StylesManager.applyTheme('default');

function MyMathExpressionEvaluator(params) {
  // console.log('params', params);
  const expr = params[0];
  const correctAnswer = mathExpressionEvaluator.eval(expr);
  return correctAnswer;
}
Survey.FunctionFactory.Instance.register(
  'MyMathExpressionEvaluator',
  MyMathExpressionEvaluator
);

function surveyValidateQuestion(s, options) {
  if (options.name === 'pricelimit') {
    const { leastamount } = options.value;
    const { mostamount } = options.value;
    if (leastamount > mostamount) {
      options.error = "The 'most amount' should be more 'less amount'.";
    }
  }
  if (options.name === 'firstcomputer') {
    if (options.value.indexOf('computer') < 0) {
      options.error = "Please type the word 'computer'.";
    }
  }
}

function sendDataToServer(survey) {
  // send Ajax request to your web server.
  // alert(`The results are:${JSON.stringify(survey.data)}`);
}

export default function S() {
  return (
    <Survey.Survey
      json={surveyJSON}
      onValidateQuestion={surveyValidateQuestion}
      onComplete={sendDataToServer}
    />
  );
}
