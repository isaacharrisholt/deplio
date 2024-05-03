from datetime import date

from cadwyn.structure import Version, VersionBundle

from deplio.models.data import head

version_bundle = VersionBundle(
    Version(date(2024, 2, 26)),
    head_schemas_package=head,
)
