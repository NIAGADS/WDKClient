import { ClientPluginRegistryEntry } from 'wdk-client/Utils/ClientPlugin';
import DefaultQuestionForm from 'wdk-client/Views/Question/DefaultQuestionForm';
import ParameterComponent from 'wdk-client/Views/Question/ParameterComponent';
import { ByGenotypeNumberCheckbox } from 'wdk-client/Views/Question/Params/ByGenotypeNumberCheckbox/ByGenotypeNumberCheckbox'
import { ByGenotypeNumber } from 'wdk-client/Views/Question/Forms/ByGenotypeNumber/ByGenotypeNumber';
import { ByLocation } from 'wdk-client/Views/Question/Forms/ByLocation/ByLocation';
import DefaultQuestionController from 'wdk-client/Controllers/QuestionController';

// Default set of plugins provided by wdk
// FIXME Make this typesafe by enumerating
// TODO Move the custom question pages/parameters to the registries for Ebrc and/or Api
const pluginConfig: ClientPluginRegistryEntry<any>[] = [
  {
    type: 'questionController',
    component: DefaultQuestionController
  },
  {
    type: 'questionForm',
    searchName: 'ByGenotypeNumber',
    component: ByGenotypeNumber
  },
  {
    type: 'questionForm',
    test: ({ question }) => !!(
      question && 
      question.urlSegment.endsWith('ByLocation')
    ),
    component: ByLocation
  },
  {
    type: 'questionForm',
    component: DefaultQuestionForm
  },
  {
    type: 'questionFormParameter',
    name: 'genotype',
    searchName: 'ByGenotypeNumber',
    component: ByGenotypeNumberCheckbox
  },
  {
    type: 'questionFormParameter',
    component: ParameterComponent
  }
];

export default pluginConfig;
