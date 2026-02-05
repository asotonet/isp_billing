import re


def validate_cedula_fisica(cedula: str) -> bool:
    """Validate Costa Rica physical cedula: 9 digits."""
    return bool(re.match(r"^\d{9}$", cedula))


def validate_cedula_juridica(cedula: str) -> bool:
    """Validate Costa Rica juridical cedula: starts with 3, 10 digits."""
    return bool(re.match(r"^3\d{9}$", cedula))


def validate_dimex(dimex: str) -> bool:
    """Validate DIMEX: 11 or 12 digits."""
    return bool(re.match(r"^\d{11,12}$", dimex))


def validate_nite(nite: str) -> bool:
    """Validate NITE: 10 digits."""
    return bool(re.match(r"^\d{10}$", nite))


def validate_identificacion(tipo: str, numero: str) -> bool:
    """Validate identification number based on type."""
    validators = {
        "cedula_fisica": validate_cedula_fisica,
        "cedula_juridica": validate_cedula_juridica,
        "dimex": validate_dimex,
        "nite": validate_nite,
    }
    validator = validators.get(tipo)
    if validator is None:
        return False
    return validator(numero)
