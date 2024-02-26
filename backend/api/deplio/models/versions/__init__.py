from cadwyn.structure import Version, VersionBundle
from deplio.models.data import latest
from datetime import date

version_bundle = VersionBundle(
    Version(date(2024, 2, 26)),
    latest_schemas_package=latest,
)
