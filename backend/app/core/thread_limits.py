import os


THREAD_ENV_VARS = (
    "OPENBLAS_NUM_THREADS",
    "OMP_NUM_THREADS",
    "MKL_NUM_THREADS",
    "NUMEXPR_NUM_THREADS",
    "VECLIB_MAXIMUM_THREADS",
    "BLIS_NUM_THREADS",
    "LOKY_MAX_CPU_COUNT",
)


def apply_thread_limits(max_threads: str = "1") -> None:
    """Cap native math/thread pools before NumPy/OpenBLAS initialize.

    The exported RandomForest was trained with n_jobs=-1. Loading it and then
    predicting with the default thread pool can exhaust RAM on this machine
    (OpenBLAS allocation retries). These limits must be set before numpy import.
    """
    for name in THREAD_ENV_VARS:
        os.environ.setdefault(name, max_threads)
    os.environ.setdefault("JOBLIB_MULTIPROCESSING", "0")
