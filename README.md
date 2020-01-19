# AWS Organization Formation

AWS Organization Formation is an Infrastructure as Code (IaC) tool for AWS Organizations.

## Features

AWS Organization Formation (also: ``org-formation``) has 3 main features:

1. Infrastructure as Code for AWS Organizations:
[![Infrastructure as Code for AWS Organizations](docs/img/feature-1-update-org.png)](docs/organization-resources.md)
[Organization resources reference](docs/organization-resources.md)


&nbsp;

2. CloudFormation annotations to provision resources cross account:
[![CloudFormation annotations to provision resources cross account](docs/img/feature-2-update-stacks.png)](docs/cloudformation-resources.md)
[Organization Annotated CloudFormation reference](docs/organization-resources.md)



&nbsp;


3. Automation of account creation and resource provisioning:
[![Automation of account creation and resource provisioning](docs/img/feature-3-perform-tasks.png)](docs/task-files.md)
[Automation task file reference](docs/organization-resources.md)



## Installation

```
> npm i aws-organization-formation
```

## Getting started

To get started you first need an ``org-formation`` template that describes all your Organization resources such as [Accounts](./docs/organization-resources.md#account), [OUs](./docs/organization-resources.md#organizationalunit) and [SCPs](docs/organization-resources.md#servicecontrolpolicy).

After [Installation](#installation) you can generate this file using the following command:

```
> org-formation init organization.yml  --region us-east-1 [--profile org-master-account]
```

<details>
<summary>
example output organization.yml file
</summary>

```yaml
AWSTemplateFormatVersion: '2010-09-09-OC'

Organization:
  Root:
    Type: OC::ORG::MasterAccount
    Properties:
      AccountName: My Organization Root
      AccountId: '123123123123'
      Tags:
        budget-alarm-threshold: '2500'
        account-owner-email: my@email.com

  OrganizationRoot:
    Type: OC::ORG::OrganizationRoot
    Properties:
      ServiceControlPolicies:
        - !Ref RestrictUnusedRegionsSCP

  ProductionAccount:
    Type: OC::ORG::Account
    Properties:
      RootEmail: production@myorg.com
      AccountName: Production Account
      Tags:
        budget-alarm-threshold: '2500'
        account-owner-email: my@email.com

  DevelopmentAccount:
    Type: OC::ORG::Account
    Properties:
      RootEmail: development@myorg.com
      AccountName: Development Account
      Tags:
        budget-alarm-threshold: '2500'
        account-owner-email: my@email.com

  DevelopmentOU:
    Type: OC::ORG::OrganizationalUnit
    Properties:
      OrganizationalUnitName: development
      Accounts:
        - !Ref DevelopmentAccount

  ProductionOU:
    Type: OC::ORG::OrganizationalUnit
    Properties:
      OrganizationalUnitName: production
      Accounts:
        - !Ref ProductionAccount

  RestrictUnusedRegionsSCP:
    Type: OC::ORG::ServiceControlPolicy
    Properties:
      PolicyName: RestrictUnusedRegions
      Description: Restrict Unused regions
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnsupportedRegions
            Effect: Deny
            NotAction:
              - 'cloudfront:*'
              - 'iam:*'
              - 'route53:*'
              - 'support:*'
            Resource: '*'
            Condition:
              StringNotEquals:
                'aws:RequestedRegion':
                  - eu-west-1
                  - us-east-1
                  - eu-central-1
```

</details>

**Note**: If you prefer to set up CI/CD run ``org-formation init-pipeline`` instead. It will create a CodeCommit repository and CodePipeline that will update your organization upon every commit!

You can make changes to the file you generated  and upate your organization using the ``update`` commmand. Alternatively you can run ``create-change-set`` and ``update-change-set``. Read more in the [cli reference](docs/cli-reference.md)

Once you got the hang of managing organization resources, use these organization resources to write smarter cloudformation that allows you to provision resources across your organization. Read more [about managing resources across accounts](docs/cloudformation-resources.md).

## Why is this important?

Just like with the resources within your AWS Account, managing AWS Organization resources **as code** allows you to apply changes automatically, reducing manual work, inconsistencies and mistakes.

If you are considering to use an account vending machine (e.g. [AWS Control Tower](https://aws.amazon.com/controltower/)) to create and manage new accounts within your organization: Do realize that the account vending machine allows you to quickly create organization resources but only has limited facilities when it comes to updating and maintaining these resoruces.

## More docs

- [Examples](examples/)
- [List of 60+ features](docs/features.pdf)
- [Managing AWS Organizations as code](docs/organization-resources.md)
- [Organization Annotated CloudFormation](docs/cloudformation-resources.md)
- [Automating deployments](docs/task-files.md)
- [CLI reference](docs/cli-reference.md)
- [Changelog](CHANGELOG.md)