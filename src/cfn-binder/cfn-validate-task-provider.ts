import { CloudFormation } from 'aws-sdk';
import { ValidateTemplateInput } from 'aws-sdk/clients/cloudformation';
import uuid = require('uuid');
import { OrgFormationError } from '../org-formation-error';
import { ICfnBinding } from './cfn-binder';
import { ICfnTask } from './cfn-task-provider';
import { CfnExpressionResolver } from '~core/cfn-expression-resolver';
import { TemplateRoot } from '~parser/parser';
import { PersistedState } from '~state/persisted-state';

export class CfnValidateTaskProvider {
    constructor(private readonly template: TemplateRoot, private readonly state: PersistedState, private readonly logVerbose: boolean) {

    }

    public async enumTasks(bindings: ICfnBinding[]): Promise<ICfnTask[]> {
        const result: ICfnTask[] = [];
        for (const binding of bindings) {
            if (binding.action !== 'Delete') {
                const validationTask = await this.createValidationTask(binding);
                result.push(validationTask);
            }
        }
        return result;
    }

    private async createValidationTask(binding: ICfnBinding): Promise<ICfnTask> {
        const descriptionsOfBoundParameters: string[] = [];
        const boundParameters = binding.template.enumBoundParameters();
        for (const paramName in boundParameters) {
            const param = boundParameters[paramName];
            delete param.ExportAccountId;
            delete param.ExportRegion;
            delete param.ExportName;
            param.Description = uuid();
            descriptionsOfBoundParameters.push(param.Description);
        }

        const expressionResolver = CfnExpressionResolver.CreateDefaultResolver(binding.accountLogicalId, binding.accountId, binding.region, binding.customRoleName, this.template, this.state);
        const stackName = await expressionResolver.resolveSingleExpression(binding.stackName, 'StackName');

        return {
            accountId: binding.accountId,
            region: binding.region,
            stackName,
            isDependency: (): boolean => false,
            action: 'Validate',
            perform: async (): Promise<void> => {
                const templateBody = await binding.template.createTemplateBodyAndResolve(expressionResolver);
                const validateInput: ValidateTemplateInput =  {
                    TemplateBody: templateBody,
                };

                const cfn = new CloudFormation({region: binding.region});
                const result = await cfn.validateTemplate(validateInput).promise();
                const missingParameters: string[] = [];
                for (const param of result.Parameters) {

                    if (param.DefaultValue !== undefined) {
                        continue;
                    }
                    if (binding.parameters && (binding.parameters[param.ParameterKey] !== undefined)) {
                        continue;
                    }
                    if (descriptionsOfBoundParameters.includes(param.Description)) {
                        continue;
                    }
                    missingParameters.push(param.ParameterKey);
                }
                if (missingParameters.length > 0)  {
                    throw new OrgFormationError(`template expects parameter(s) ${missingParameters.join(', ')} which have not been provided`);
                }
            },
        };
    }
}
