import React from 'react';
import * as Survey from 'survey-react';
import mathExpressionEvaluator from 'math-expression-evaluator/dist/browser/math-expression-evaluator';

import 'survey-react/survey.css'; // default theme
// import 'survey-react/modern.min.css'; // modern theme
import './Survey.global.css';
import electron from 'electron';
import genSurveyJSON from './Survey.data';

const { ipcRenderer } = electron;

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
  survey = null;

  constructor(props) {
    super(props);
    this.state = {
      surveyJSON: genSurveyJSON(3),
    };

    const onClickedFile = (event, message: string) => {
      console.log('clicked_file', message);
    };
    this.on_clicked_file = onClickedFile.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('clicked_file', this.on_clicked_file);
  }

  componentWillUnmount() {
    ipcRenderer.off('clicked_file', this.on_clicked_file);
  }

  render() {
    const { surveyJSON } = this.state;
    // 用 model 才行，用json更新状态 surveyJSON 不灵
    const model = new Survey.Model(surveyJSON);
    return (
      <Survey.Survey
        model={model}
        onValidateQuestion={surveyValidateQuestion}
        onComplete={(sv: Survey.ReactSurveyModel, options) => {
          // Restart survey once it is completed. #816
          // https://github.com/surveyjs/survey-library/issues/816
          // sv.clear();
          // sv.render();

          const reply = ipcRenderer.sendSync('SYNC_SURVEY_COMPLETE', 'ok');
          console.log('[MAIN MSG]', reply);

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
