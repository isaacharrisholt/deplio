from deplio.types.enums import Headers
from fastapi.datastructures import Headers as FastAPIHeaders


def get_forward_headers(header: FastAPIHeaders) -> dict[str, str]:
    header_prefix = f'{Headers.FORWARD}-'
    return {
        key.replace(header_prefix, ''): value
        for key, value in header.items()
        if key.lower().startswith(header_prefix)
    }


def query_params_to_dict(
    query_params: list[tuple[str, str]],
) -> dict[str, str | list[str]]:
    output: dict[str, str | list[str]] = {}
    for param in query_params:
        key, value = param
        if key in output:
            current_value = output[key]
            if isinstance(current_value, list):
                current_value.append(value)
            else:
                output[key] = [current_value, value]
        else:
            output[key] = value

    return output
