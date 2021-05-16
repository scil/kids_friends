import React from 'react';
import * as Survey from 'survey-react';
import mathExpressionEvaluator from 'math-expression-evaluator/dist/browser/math-expression-evaluator';

import 'survey-react/survey.css'; // default theme
// import 'survey-react/modern.min.css'; // modern theme
import './Survey.global.css';
import genSurveyJSON from './Survey.data';

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

// 函数式组件里，更新状态 surveyJSON 不灵
// export function __MySurvey() {
//   const [surveyJSON, setSurveyJSON] = useState(genSurveyJSON(3));
// }

export default class MySurvey extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      surveyJSON: genSurveyJSON(3),
    };
  }

  render() {
    // 用 model 才行，用json更新状态 surveyJSON 不灵
    const { surveyJSON } = this.state;
    const model = new Survey.Model(surveyJSON);
    return (
      <Survey.Survey
        model={model}
        onValidateQuestion={surveyValidateQuestion}
        onComplete={(sender: Survey.ReactSurveyModel, options) => {
          // Restart survey once it is completed. #816
          // https://github.com/surveyjs/survey-library/issues/816
          // sender.clear();
          // sender.render();

          this.setState((state, props) => {
            return {
              surveyJSON: genSurveyJSON(3),
            };
          });
        }}
      />
    );
  }
}
