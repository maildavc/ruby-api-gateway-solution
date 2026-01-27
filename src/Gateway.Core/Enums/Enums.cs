namespace Gateway.Core.Enums;

public enum CryptoAlgorithm
{
    NONE,
    AES_256_GCM,
    AES_256_CBC_HMAC
}

public enum KeySource
{
    UserProfileKey,
    ServiceKey,
    EndpointKey
}

public enum IvSource
{
    UserProfileIv,
    ServiceIv,
    EndpointIv
}

public enum Encoding
{
    Base64,
    Hex
}

public enum LoadBalancingPolicy
{
    RoundRobin,
    LeastRequests,
    Random,
    PowerOfTwoChoices
}

public enum EnvironmentType
{
    Dev,
    UAT,
    Prod
}

public enum PayloadExpectation
{
    Encrypted,
    Decrypted,
    Plain
}
