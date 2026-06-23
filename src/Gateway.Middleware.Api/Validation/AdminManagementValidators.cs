using FluentValidation;
using Gateway.Core.Entities.Requests;

namespace Gateway.Middleware.Api.Validation;

public class ProductCreateRequestValidator : AbstractValidator<ProductCreateRequest>
{
    public ProductCreateRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.OwnerTeam).NotEmpty().MaximumLength(100);
    }
}

public class ServiceCreateRequestValidator : AbstractValidator<ServiceCreateRequest>
{
    public ServiceCreateRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.ServiceName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.BasePath).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Version).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.OwnerTeam).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ClusterId).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Destinations).NotNull().NotEmpty();
    }
}

public class EndpointCreateRequestValidator : AbstractValidator<EndpointCreateRequest>
{
    public EndpointCreateRequestValidator()
    {
        RuleFor(x => x.ServiceId).NotEmpty();
        RuleFor(x => x.EndpointName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.HttpMethod).NotEmpty().MaximumLength(50);
        RuleFor(x => x.RelativePath).NotEmpty().MaximumLength(200);
    }
}

public class ClientCreateRequestValidator : AbstractValidator<ClientCreateRequest>
{
    public ClientCreateRequestValidator()
    {
        RuleFor(x => x.ClientId).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ClientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ClientSecret).NotEmpty().MaximumLength(500);
    }
}

public class ClientPermissionCreateRequestValidator : AbstractValidator<ClientPermissionCreateRequest>
{
    public ClientPermissionCreateRequestValidator()
    {
        RuleFor(x => x.ClientId).NotEmpty();
        RuleFor(x => x.EndpointId).NotEmpty();
    }
}

public class UserProfileCreateRequestValidator : AbstractValidator<UserProfileCreateRequest>
{
    public UserProfileCreateRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().MaximumLength(100);
        RuleFor(x => x.EncryptionKey).NotEmpty();
    }
}

public class ServiceDestinationCreateRequestValidator : AbstractValidator<ServiceDestinationCreateRequest>
{
    public ServiceDestinationCreateRequestValidator()
    {
        RuleFor(x => x.ServiceId).NotEmpty();
        RuleFor(x => x.DestinationName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
    }
}
