// Small deterministic fixtures validate mechanics, not real-world model quality.
// Design reviews use explicit acceptance criteria rather than fake execution.
const task=(topic,difficulty,slug,title,prompt,objective,requirements,cases,hints,explanation,solution,checks=null)=>({
    id:`ai-ml-${slug}-v1`,career:'AI Engineer',phase:'Machine Learning',topic,title,difficulty,
    kind:checks===null?'written':'coding',language:checks===null?'Experimental design':'Python',
    estimatedTime:difficulty==='Easy'?'20–30 minutes':difficulty==='Medium'?'35–50 minutes':'50–80 minutes',
    problemStatement:prompt,simplerProblem:objective,learningObjectives:[objective,`Verify the stated ${topic} assumptions and boundary cases.`],
    prerequisites:['Python arrays and tables','Training versus held-out observations'],conceptsToReview:[topic],requirements,
    examples:cases.map(([input,output])=>({input,output,explanation})),tests:cases.map(([input,expected],i)=>({name:`Acceptance case ${i+1}`,input,expected})),
    hints,approach:explanation,walkthrough:cases.map(([input,output])=>`${input} → ${output}`).join('\n')+'\n'+explanation,
    solutionCode:solution,solutionLines:[explanation,...hints],completionCriteria:requirements,commonMistakes:[],
    starterCode:checks===null?'Decision, evidence, split policy, and limitations:\n':'# Implement the stated contract; fit learned state on training data only.\n',
    followUp:`Add a documented ${topic} failure case and explain how it changes the acceptance decision.`,referenceChecks:checks
});

export const AI_MACHINE_LEARNING_PRACTICE=[
    task('ML Fundamentals','Easy','task-type','Match a learning task to the information available',
        'A team wants to predict next-month numeric energy use, assign reviewed support categories, and discover groups of unlabeled browsing sessions. For each task identify the learning setting, target if any, and a sensible initial baseline or exploratory comparison. Do not confuse discovery groups with verified labels.',
        'Distinguish supervised regression, supervised classification, and unsupervised grouping.',
        ['Name the target and prediction-time information for supervised tasks.','Do not claim clusters are ground-truth classes or causal customer types.'],
        [['Reviewed support-category examples','Supervised classification; compare with a training-only majority-class baseline.'],['Unlabeled session vectors','Unsupervised clustering; inspect representation, scaling, stability, and representative sessions.']],
        ['Ask whether example outcomes are supplied.','Numeric versus categorical targets changes the supervised objective.'],
        'The presence and meaning of labels determine the task before an algorithm is chosen. Exploratory groups require domain review and stability checks rather than a classification accuracy claim against nonexistent labels.',
        'Energy use: supervised regression; define horizon and units, and compare a historical/seasonal or training-only constant predictor.\nSupport categories: supervised classification with a documented annotation policy; start with a majority-category baseline and class-aware validation.\nSessions: unsupervised clustering using justified features/distance and scaling; review group examples and stability. For all three define the observation unit and prevent future or same-entity information crossing the intended evaluation boundary.'),
    task('ML Fundamentals','Easy','split-roles','Assign training, validation, and test responsibilities',
        'A team trains on one split, tries twenty parameter settings on another, and reports the best score on that same tuning split as final performance. Explain the optimistic selection effect and redesign the three data roles without requiring a new split for every parameter value.',
        'Separate fitting, selection, and final reporting.',
        ['Use training for model/preprocessor fitting and validation or inner CV for selection.','Keep a representative final test set untouched until the pipeline and decision policy are frozen.'],
        [['Choose model depth or classification threshold','Use validation/inner CV, not the final test set.'],['Report the selected frozen pipeline','Evaluate on untouched test observations and report uncertainty/limitations.']],
        ['Repeated selection uses information even without fitting model weights.','A held-out test cannot remain untouched if it repeatedly guides revisions.'],
        'Validation estimates participate in choosing the winner, so the winner’s tuning score is selected favorably. A final held-out evaluation or outer CV estimates the selection procedure on data not used for that choice.',
        'Define the deployment population and split unit first. Fit learned transforms and estimators on training only; use validation or inner folds for hyperparameters, features, calibration, and thresholds.\nFreeze the complete pipeline, evaluate once on the held-out test under the protocol, and report sample size and subgroup limitations. If the test already guided substantial revisions, disclose that use and obtain a fresh independent evaluation or use a properly nested protocol; renaming the tuning split does not fix selection bias.'),
    task('ML Fundamentals','Easy','imbalance-baseline','Reject a misleading accuracy-only baseline claim',
        'A rare-event detector sees ten positive cases among one thousand examples. Always predicting negative yields 99 percent accuracy. Assess that baseline, calculate its positive recall, and define what evidence is needed before calling a new model useful.',
        'Use a baseline to expose the consequences of class imbalance.',
        ['Calculate TP=0,FN=10,TN=990,FP=0 and recall zero.','Compare validation outcomes using decision costs and class-aware metrics, not accuracy alone.'],
        [['Always-negative predictor on the supplied counts','Accuracy 0.99; positive recall 0.'],['New model reaches 98 percent accuracy with positive detections','Cannot decide usefulness without false-positive/false-negative counts and application costs.']],
        ['Accuracy weights the many negative cases heavily.','Precision has a zero-denominator convention when nothing is predicted positive.'],
        'A high baseline accuracy can coexist with complete failure to find the important class. A decision-aware comparison must specify the positive class, costs, prevalence, and the handling of undefined metrics.',
        'The confusion counts are TN=990, FP=0, FN=10, TP=0. Accuracy is 990/1000=0.99 and recall is 0/10=0. Precision is undefined with no positive predictions; report that explicitly or disclose the library zero-division convention.\nChoose a validation metric/operating point based on costs or recall/precision constraints and compare against the baseline. Check class support, data quality, and deployment prevalence; keep threshold selection away from final test labels.'),
    task('ML Fundamentals','Medium','stratified-split','Create a reproducible stratified holdout by row index',
        'Implement stratified_holdout(y), returning disjoint train/validation indices with a 25 percent validation share, random_state=7, and stratification. Assume independent examples and enough examples per class for the split; reject unsupported cases through the library rather than duplicating samples.',
        'Preserve class coverage under an appropriate independent-row split.',
        ['Split indices so all feature/label arrays can use the same partition.','State that stratification does not prevent repeated-person or temporal leakage.'],
        [['Eight examples of each of two classes','Validation has four rows, with two from each class.'],['Repeated calls with the same labels','Same train and validation indices.']],
        ['Use train_test_split with stratify=y.','An index split avoids independently shuffling related arrays.'],
        'Stratification controls class allocation for the stated independent-row setting. It does not justify a random split when records share entities or future information.',
        String.raw`import numpy as np
from sklearn.model_selection import train_test_split

def stratified_holdout(y):
    labels=np.asarray(y)
    indices=np.arange(len(labels))
    return train_test_split(indices,test_size=0.25,random_state=7,stratify=labels)`,
        String.raw`y=np.array([0]*8+[1]*8)
a,b=stratified_holdout(y); c,d=stratified_holdout(y)
assert len(a)==12 and len(b)==4 and not set(a)&set(b)
assert set(a)|set(b)==set(range(16)) and np.bincount(y[b]).tolist()==[2,2]
np.testing.assert_array_equal(a,c); np.testing.assert_array_equal(b,d)`),
    task('ML Fundamentals','Medium','group-holdout','Hold out entire users rather than their individual rows',
        'Implement user_holdout(groups), returning training and validation indices using GroupShuffleSplit with test_size=0.25 and random_state=3. Multiple records from one user must stay together. Explain why the fraction is a fraction of groups, not necessarily rows.',
        'Evaluate unseen-user generalization without entity overlap.',
        ['Use one group-aware split and retain all row indices exactly once.','Do not claim exact row balance when user sizes differ.'],
        [['Four users with unequal row counts','One complete user group is held out.'],['User appears repeatedly','No user occurs on both sides.']],
        ['Group labels represent the leakage boundary.','Choose the boundary from the deployment task, not the most convenient column.'],
        'A group-aware holdout estimates performance on unseen users rather than memorized users’ additional rows. Its row sizes depend on the sampled user groups.',
        String.raw`import numpy as np
from sklearn.model_selection import GroupShuffleSplit

def user_holdout(groups):
    groups=np.asarray(groups)
    split=GroupShuffleSplit(n_splits=1,test_size=0.25,random_state=3)
    return next(split.split(np.zeros((len(groups),1)),groups=groups))`,
        String.raw`g=np.array(['a','a','b','c','c','c','d'])
a,b=user_holdout(g)
assert not set(g[a])&set(g[b]) and len(set(g[b]))==1
assert set(a)|set(b)==set(range(len(g))) and not set(a)&set(b)
c,d=user_holdout(g); np.testing.assert_array_equal(b,d)`),
    task('ML Fundamentals','Medium','temporal-cutoff','Split by event time with an explicit exclusion gap',
        'Implement temporal_indices(times,cutoff,gap) for numeric timestamps and a nonnegative gap. Training rows require time < cutoff-gap, validation rows require time >= cutoff, and rows in between are excluded. Return original indices and explain how label maturity can require an additional delay.',
        'Define temporal eligibility rather than shuffling future observations into training.',
        ['Use a strict training boundary and inclusive validation boundary.','Reject negative gap and keep excluded rows out of both sets.'],
        [['times [1,2,3,4,5], cutoff 4, gap 1','train indices [0,1], validation [3,4], exclude index 2.'],['gap zero','All times below cutoff may train; cutoff itself validates.']],
        ['Time order and label availability are distinct conditions.','A purge gap addresses only the overlap it was designed to remove.'],
        'The masks express the actual date contract and leave a deliberate no-use interval. Real delayed outcomes also require knowing whether each training label was observable at the training snapshot.',
        String.raw`import numpy as np

def temporal_indices(times,cutoff,gap):
    if gap<0: raise ValueError('Negative gap')
    t=np.asarray(times)
    return np.flatnonzero(t<cutoff-gap),np.flatnonzero(t>=cutoff)`,
        String.raw`a,b=temporal_indices([1,2,3,4,5],4,1)
assert a.tolist()==[0,1] and b.tolist()==[3,4]
a,b=temporal_indices([4,1,3],4,0); assert a.tolist()==[1,2] and b.tolist()==[0]
try: temporal_indices([1],2,-1)
except ValueError: pass
else: raise AssertionError('negative gap')`),
    task('ML Fundamentals','Hard','point-in-time','Audit a feature snapshot for historical availability',
        'A churn model predicts at the start of March, but its training join uses the latest customer record and includes a cancellation status updated in April. Design a point-in-time dataset rebuild covering feature event time, availability time, label horizon, and immutable evaluation snapshots.',
        'Prevent future information entering historical examples.',
        ['Join only feature versions actually available by each decision time.','Keep future label windows separate and require mature labels under the training snapshot.'],
        [['Customer cancellation status updated after prediction time','Exclude that future version even if it describes an earlier business event.'],['Feature event occurred earlier but arrived late','Do not pretend it was available before ingestion/availability time.']],
        ['Event time alone may not establish what the system knew.','A latest-record join is not a historical as-of join.'],
        'Leakage depends on information availability, not just column names. Reconstructing snapshots requires provenance and versioned source data; a temporal train/test split cannot repair future values already embedded in every row.',
        'Define one observation as (entity,decision_time), its future label window, and the training-data extraction time. Version features with event and availability timestamps; join only eligible versions known at each decision_time.\nExclude immature labels, purge overlap where horizons share outcomes, and keep entity/time split policies consistent with deployment. Rebuild from authoritative version history, then compare suspect versus valid feature availability and performance. Freeze dataset/schema versions and test late-arriving records; if history is unavailable, acknowledge that past feature availability cannot be proven from the current latest table.'),
    task('ML Fundamentals','Hard','experiment-budget','Design a search protocol that does not consume the final test set',
        'An ML team compares preprocessing, feature subsets, algorithms, calibration, and decision thresholds, repeatedly viewing the final test score. Design a corrected experimental protocol under a fixed compute budget and explain why merely fitting model weights on training data is insufficient to avoid leakage.',
        'Treat all data-driven choices as part of model selection.',
        ['Keep learned preprocessing and selection inside the appropriate training/inner folds.','Use an untouched holdout or outer CV for final assessment and disclose earlier test reuse.'],
        [['Feature subset chosen after looking at final test errors','That test has participated in selection even if no weights were fit on it.'],['Budget permits limited nested search','Reduce candidates or folds explicitly rather than moving tuning onto test data.']],
        ['Hyperparameters include more than the estimator constructor.','The estimated object is the full selection-and-training procedure.'],
        'Leakage includes feedback used to select representations and operating points. A compute-constrained but honest protocol is preferable to a larger search scored on data already used for decisions.',
        'Predefine target, unit, metric, split constraints, candidate budget, and stopping rule. Use inner training/validation folds to fit preprocessing, select features/models, calibrate, and set thresholds under the intended protocol.\nUse outer folds or a genuinely untouched held-out sample to evaluate the resulting frozen procedure. If earlier test results influenced revisions, disclose the contamination and obtain independent evaluation where feasible. Report search scope, variability, failure cases, and budget compromises; do not label the best repeatedly viewed test score an unbiased generalization estimate.'),
    task('ML Fundamentals','Hard','deployment-shift','Investigate a production metric drop before retraining',
        'A validated model performs worse after deployment. Traffic mix changed, some features arrive late, and ground-truth labels are delayed. Design an investigation separating serving/training skew, population shift, and label-quality problems, with a safe decision about retraining or rollback.',
        'Use production evidence without confusing drift with confirmed error causation.',
        ['Check schema/transforms and prediction-time feature availability first.','Evaluate mature representative outcomes and keep rollback/retraining acceptance separate from drift alarms.'],
        [['Feature null rate jumps after a serving release','Investigate the pipeline mismatch rather than assuming the underlying target changed.'],['Label delay means recent outcomes are incomplete','Do not compare incomplete recent labels directly with mature historical labels.']],
        ['Covariate drift is a warning, not proof of degraded decision quality.','Changing the model cannot fix every data-contract or instrumentation failure.'],
        'A production investigation needs aligned populations, timestamps, and label maturity. Fixing broken feature delivery and correcting evaluation selection can be more urgent than fitting another model.',
        'Record deployed artifact, feature schema, transform versions, input distributions, missingness, latency, and decision logs with privacy controls. Reproduce predictions offline from the actual available inputs to identify serving skew.\nCompare mature labels under the same horizon and representative population, including subgroups and baseline decisions. Check annotation/measurement changes and selection bias. Restore a compatible known-good pipeline or degrade safely when warranted; retrain only with a leakage-safe dataset and independent validation against the new operating conditions. Document uncertainty while labels remain incomplete.'),

    task('Regression','Easy','linear-predict','Evaluate a one-feature linear prediction',
        'Implement linear_predict(x,slope,intercept) for finite numeric x values. Return a float array with the same shape using slope*x+intercept, and explain why the coefficients must be learned on training observations rather than selected using final test outcomes.',
        'Connect linear parameters to numeric predictions.',
        ['Convert to float before arithmetic and preserve input shape.','Do not modify the caller array.'],
        [['x=[0,1,2], slope=2, intercept=1','[1,3,5]'],['empty x','Empty float array.']],['The intercept is the prediction at x=0.','Prediction applies fixed coefficients; it does not refit them.'],
        'A linear model maps each input through the same affine rule. This function demonstrates prediction mechanics, not evidence that a straight line is suitable for a real dataset.',
        String.raw`import numpy as np

def linear_predict(x,slope,intercept):
    return np.asarray(x,dtype=float)*slope+intercept`,
        String.raw`a=np.array([0,1,2]); np.testing.assert_allclose(linear_predict(a,2,1),[1,3,5])
np.testing.assert_array_equal(a,[0,1,2]); assert linear_predict([],2,1).shape==(0,)`),
    task('Regression','Easy','regression-errors','Calculate MAE and RMSE in target units',
        'Implement regression_errors(actual,predicted) for nonempty equal-length one-dimensional finite arrays. Return MAE and RMSE, reject shape mismatches, and explain why RMSE penalizes a few large errors more strongly than MAE.',
        'Compute error magnitude metrics without changing units accidentally.',
        ['Use mean absolute error and square root of mean squared error.','Do not report MSE as if it were in the original target units.'],
        [['actual=[1,3], predicted=[2,1]','MAE=1.5, RMSE=sqrt(2.5)'],['perfect predictions','Both metrics zero.']],['Subtract matched observations before reducing.','Take the square root only after averaging squared errors.'],
        'MAE averages absolute residuals, while RMSE squares them before averaging and returning to target units. The metric should reflect the application loss, not whichever yields a larger-looking improvement.',
        String.raw`import numpy as np

def regression_errors(actual,predicted):
    y=np.asarray(actual,dtype=float); p=np.asarray(predicted,dtype=float)
    if y.ndim!=1 or y.size==0 or p.shape!=y.shape: raise ValueError('Shape mismatch')
    error=y-p
    return float(np.abs(error).mean()),float(np.sqrt(np.mean(error**2)))`,
        String.raw`mae,rmse=regression_errors([1,3],[2,1]); assert mae==1.5 and np.isclose(rmse,np.sqrt(2.5))
assert regression_errors([1,2],[1,2])==(0,0)
for y,p in [([],[]),([1],[1,2]),([[1]],[[1]])]:
    try: regression_errors(y,p)
    except ValueError: pass
    else: raise AssertionError('invalid shapes')`),
    task('Regression','Easy','median-baseline','Predict an absolute-error baseline from training labels',
        'Implement median_baseline(train_y,n_predictions) for a nonempty finite numeric target vector and an exact nonnegative prediction count. Return constant predictions using the training median, not any validation labels. Explain why the median is a natural constant baseline under absolute error.',
        'Fit a simple loss-appropriate baseline without using held-out outcomes.',
        ['Use only train_y to select the constant.','Allow zero predictions and reject invalid counts.'],
        [['train_y=[1,2,100], count=2','[2,2]'],['train_y=[1,3], count=1','[2]']],['Absolute deviations are minimized by a median.','Prediction count does not supply target information.'],
        'The median limits the effect of a large outlier for absolute-error loss. Baseline selection and fitting still belong to training; held-out labels are used only to assess the fixed baseline.',
        String.raw`import numpy as np

def median_baseline(train_y,n_predictions):
    y=np.asarray(train_y,dtype=float)
    if y.ndim!=1 or not y.size or type(n_predictions) is not int or n_predictions<0: raise ValueError('Invalid input')
    return np.full(n_predictions,np.median(y),dtype=float)`,
        String.raw`np.testing.assert_array_equal(median_baseline([1,2,100],2),[2,2])
np.testing.assert_allclose(median_baseline([1,3],1),[2]); assert median_baseline([1],0).size==0
try: median_baseline([],1)
except ValueError: pass
else: raise AssertionError('empty training target')`),
    task('Regression','Medium','ols-fit','Fit an intercept without inverting a singular normal matrix',
        'Implement fit_ols(x,y) for a nonempty finite 2D design matrix and matching 1D targets. Add an intercept column and use least squares directly. Return coefficients with intercept first, including a documented minimum-norm result for rank-deficient designs.',
        'Fit linear regression using a numerically appropriate solver.',
        ['Use np.linalg.lstsq rather than explicitly inverting X.T@X.','Validate row shape and do not fit on validation/test observations.'],
        [['x=[[0],[1],[2]], y=[1,3,5]','Approximately [1,2]'],['duplicate feature columns','A least-squares minimum-norm solution rather than an inversion failure.']],['A column of ones models the intercept.','Rank deficiency means coefficients need not be uniquely identifiable.'],
        'Least squares solves the residual minimization problem without requiring an invertible normal matrix. A minimum-norm solution can predict correctly even when correlated columns make individual coefficients non-identifiable.',
        String.raw`import numpy as np

def fit_ols(x,y):
    x=np.asarray(x,dtype=float); y=np.asarray(y,dtype=float)
    if x.ndim!=2 or not len(x) or y.shape!=(len(x),): raise ValueError('Invalid shapes')
    design=np.column_stack([np.ones(len(x)),x])
    return np.linalg.lstsq(design,y,rcond=None)[0]`,
        String.raw`np.testing.assert_allclose(fit_ols([[0],[1],[2]],[1,3,5]),[1,2],atol=1e-10)
x=np.array([[0,0],[1,1],[2,2]]); b=fit_ols(x,[1,3,5]); np.testing.assert_allclose(np.c_[np.ones(3),x]@b,[1,3,5],atol=1e-10)
try: fit_ols([[1]],[1,2])
except ValueError: pass
else: raise AssertionError('bad shape')`),
    task('Regression','Medium','residual-groups','Report signed bias and absolute error by operating group',
        'Implement residual_report(y,pred,groups) for finite 1D paired values and nonmissing string groups. Return each group’s count, mean residual actual-predicted, and MAE. Keep signed bias distinct from error magnitude; empty input returns an empty mapping.',
        'Use residual analysis to reveal systematic underprediction hidden by averages.',
        ['Validate aligned vector shapes.','Do not cancel positive/negative errors when computing MAE.'],
        [['actual [3,1], pred [1,3], one group','bias 0 but MAE 2'],['actual 5, pred 2 in group B','positive bias 3 means underprediction.']],['Signed residual direction has a convention; state it.','Analyze group counts so a tiny subgroup is not presented as a stable population estimate.'],
        'Bias shows direction while MAE shows magnitude. A zero mean residual can conceal large errors, and reporting counts makes subgroup evidence easier to interpret without inferring causal group effects.',
        String.raw`import numpy as np

def residual_report(y,pred,groups):
    y=np.asarray(y,dtype=float); p=np.asarray(pred,dtype=float); g=np.asarray(groups)
    if y.ndim!=1 or p.shape!=y.shape or g.shape!=y.shape: raise ValueError('Misaligned rows')
    error=y-p; result={}
    for group in sorted(set(groups)):
        e=error[g==group]
        result[group]={'count':len(e),'bias':float(e.mean()),'mae':float(np.abs(e).mean())}
    return result`,
        String.raw`r=residual_report([3,1,5],[1,3,2],['A','A','B'])
assert r['A']=={'count':2,'bias':0.0,'mae':2.0} and r['B']['bias']==3
assert residual_report([],[],[])=={}
try: residual_report([1],[1],[])
except ValueError: pass
else: raise AssertionError('misaligned')`),
    task('Regression','Medium','ridge-fit','Penalize slopes while leaving the intercept unpenalized',
        'Implement fit_ridge(x,y,alpha) minimizing ||y-b0-Xb|| squared plus alpha times ||b|| squared. Require alpha>0, finite arrays, nonempty rows, and matching shapes. Return intercept first and explain the penalty scaling convention rather than silently mixing summed and averaged losses.',
        'Connect L2 regularization to a precise objective.',
        ['Leave the intercept penalty at zero.','Use a linear solve and explicitly state this objective is summed squared error plus alpha penalty.'],
        [['constant y=7 with a varying feature','Intercept 7 and approximately zero slope.'],['larger alpha on a centered linear fixture','Slope shrinks toward zero.']],['The intercept column needs a different diagonal penalty.','Regularization strength depends on whether the residual loss is summed or averaged.'],
        'Adding alpha to slope diagonals stabilizes the slope solution and shrinks it, while an unpenalized intercept can still represent a nonzero target mean. Feature scales affect the penalty, so real pipelines need a training-only scaling decision.',
        String.raw`import numpy as np

def fit_ridge(x,y,alpha):
    x=np.asarray(x,dtype=float); y=np.asarray(y,dtype=float)
    if x.ndim!=2 or not len(x) or y.shape!=(len(x),) or not np.isfinite(alpha) or alpha<=0 or not np.isfinite(x).all() or not np.isfinite(y).all(): raise ValueError('Invalid input')
    d=np.column_stack([np.ones(len(x)),x]); penalty=np.eye(d.shape[1])*alpha; penalty[0,0]=0
    return np.linalg.solve(d.T@d+penalty,d.T@y)`,
        String.raw`np.testing.assert_allclose(fit_ridge([[-1],[0],[1]],[7,7,7],1),[7,0],atol=1e-10)
b1=fit_ridge([[-1],[0],[1]],[-2,0,2],1); b2=fit_ridge([[-1],[0],[1]],[-2,0,2],10)
assert 0<b2[1]<b1[1]<2
try: fit_ridge([[1]],[2],0)
except ValueError: pass
else: raise AssertionError('zero penalty')
for x,y,a in [([[float('nan')]],[1],1),([[1]],[float('inf')],1),([[1]],[1],float('nan'))]:
    try: fit_ridge(x,y,a)
    except ValueError: pass
    else: raise AssertionError('nonfinite ridge input')`),
    task('Regression','Hard','ridge-selection','Choose a regularization value without fitting on validation rows',
        'Implement select_ridge(x_train,y_train,x_val,y_val,alphas). For each positive candidate fit a StandardScaler/Ridge pipeline on training only, compare validation MSE, and return the selected fitted pipeline plus alpha. Ties choose the smaller alpha; there is no final-test input.',
        'Keep preprocessing and hyperparameter selection in their proper data roles.',
        ['Fit a fresh pipeline per candidate on training only.','Use validation to select, not to update scaler/model; leave final test assessment for a separate frozen step.'],
        [['Validation features have a much larger mean than training','Returned scaler mean remains the training mean.'],['Two candidates have exactly equal validation loss','Select smaller alpha.']],['A pipeline captures transforms and estimator in one fitted object.','Inspect learned scaler state to detect accidental full-data fitting.'],
        'Candidate selection uses validation evidence while every fitted parameter comes from training. The returned pipeline remains trained only on training; any later train-plus-validation refit must be explicit and evaluated on untouched final data.',
        String.raw`import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge

def select_ridge(x_train,y_train,x_val,y_val,alphas):
    if not alphas or any(a<=0 for a in alphas): raise ValueError('Positive candidates required')
    best=None
    for alpha in sorted(set(alphas)):
        model=make_pipeline(StandardScaler(),Ridge(alpha=alpha))
        model.fit(x_train,y_train)
        loss=float(np.mean((model.predict(x_val)-np.asarray(y_val))**2))
        if best is None or loss<best[0]: best=(loss,alpha,model)
    return best[2],best[1]`,
        String.raw`m,a=select_ridge([[0],[1],[2]],[1,3,5],[[10],[11]],[21,23],[10,0.1])
assert a==0.1; np.testing.assert_allclose(m.named_steps['standardscaler'].mean_,[1])
m,a=select_ridge([[0],[1],[2]],[7,7,7],[[4]],[7],[5,1]); assert a==1
try: select_ridge([[1]],[1],[[2]],[2],[])
except ValueError: pass
else: raise AssertionError('empty candidates')`),
    task('Regression','Hard','ridge-gradient','Check an analytical gradient against finite differences',
        'Implement ridge_gradient(x,y,theta,alpha) for objective mean((X@theta-y)^2)+alpha*sum(theta[1:]^2). X already includes an intercept column first. Return the full gradient, reject negative alpha, and verify the intercept receives no L2 term.',
        'Differentiate a regularized objective with an explicit normalization.',
        ['Use 2/n times X.T residual plus the slope-only penalty gradient.','Check with central finite differences on a small nonsingular numerical fixture.'],
        [['Perfect residuals with theta=[3,2], alpha=0.5','Gradient [0,2] from the slope penalty.'],['alpha zero','Ordinary mean-squared-error gradient.']],['The derivative of a squared residual includes a factor of two.','A gradient test must use exactly the same summed/mean loss convention.'],
        'An analytical gradient is meaningful only for its stated objective scaling. Central differences provide a local numerical consistency check, not a general proof of convergence or model suitability.',
        String.raw`import numpy as np

def ridge_gradient(x,y,theta,alpha):
    x=np.asarray(x,dtype=float); y=np.asarray(y,dtype=float); t=np.asarray(theta,dtype=float)
    if x.ndim!=2 or not len(x) or y.shape!=(len(x),) or t.shape!=(x.shape[1],) or not np.isfinite(alpha) or alpha<0 or not all(np.isfinite(v).all() for v in (x,y,t)): raise ValueError('Invalid input')
    penalty=t.copy(); penalty[0]=0
    return 2*x.T@(x@t-y)/len(x)+2*alpha*penalty`,
        String.raw`x=np.array([[1.,0],[1,1],[1,2]]); t=np.array([3.,2.]); y=x@t
np.testing.assert_allclose(ridge_gradient(x,y,t,0.5),[0,2])
y=np.array([1.,4,5]); alpha=0.3
def loss(z): return np.mean((x@z-y)**2)+alpha*np.sum(z[1:]**2)
eps=1e-6; numerical=[]
for i in range(len(t)):
    shift=np.zeros_like(t); shift[i]=eps; numerical.append((loss(t+shift)-loss(t-shift))/(2*eps))
np.testing.assert_allclose(ridge_gradient(x,y,t,alpha),numerical,rtol=1e-6,atol=1e-6)`),
    task('Regression','Hard','weighted-ols','Fit weighted least squares without a diagonal n-by-n matrix',
        'Implement weighted_ols(x,y,weights) minimizing sum(weights*(y-intercept-X@beta)^2). Require aligned finite data, nonnegative weights, and at least one positive weight. Use square-root row weighting rather than constructing an n-by-n diagonal matrix; return intercept first.',
        'Translate weighted residual loss into a standard least-squares solve.',
        ['Scale both design rows and targets by sqrt(weight).','Reject negative/all-zero weights and document rank-deficient minimum-norm behavior.'],
        [['A large outlier has weight zero','It contributes nothing to the fitted loss.'],['All weights multiplied by a positive constant','The fitted weighted least-squares solution is unchanged up to numerical tolerance.']],['Weighting only X but not y changes the problem.','Inverse-variance weights need a justified noise model, not outcome-based tuning on the final test set.'],
        'Square-root weighting makes the ordinary squared residual norm equal the requested weighted objective. Zero-weight rows are ignored by the loss; identifiability still depends on the positively weighted design.',
        String.raw`import numpy as np

def weighted_ols(x,y,weights):
    x=np.asarray(x,dtype=float); y=np.asarray(y,dtype=float); w=np.asarray(weights,dtype=float)
    if x.ndim!=2 or not len(x) or y.shape!=(len(x),) or w.shape!=y.shape or not all(np.isfinite(v).all() for v in (x,y,w)) or (w<0).any() or not (w>0).any(): raise ValueError('Invalid weights/shapes')
    d=np.column_stack([np.ones(len(x)),x]); root=np.sqrt(w)
    return np.linalg.lstsq(d*root[:,None],y*root,rcond=None)[0]`,
        String.raw`x=[[0],[1],[2]]; y=[1,3,100]; w=[1,1,0]
b=weighted_ols(x,y,w); np.testing.assert_allclose(b,[1,2],atol=1e-10)
np.testing.assert_allclose(weighted_ols(x,y,[4,4,0]),b,atol=1e-10)
for weights in [[0,0,0],[1,-1,1]]:
    try: weighted_ols(x,y,weights)
    except ValueError: pass
    else: raise AssertionError('invalid weights')
try: weighted_ols([[float('inf')]],[1],[1])
except ValueError: pass
else: raise AssertionError('nonfinite weighted design')`),

    task('Classification','Easy','score-threshold','Convert fixed scores into labels at a documented boundary',
        'Implement threshold_labels(scores,threshold) for finite 1D probabilities in [0,1] and a threshold in [0,1]. Predict positive when score is greater than or equal to the threshold, reject invalid values, and preserve an empty input as an empty integer vector.',
        'Separate model scores from an operating-point decision.',
        ['Use an inclusive decision boundary.','Reject nonfinite or out-of-range scores and thresholds.'],
        [['scores [0.2,0.5,0.9], threshold 0.5','[0,1,1]'],['empty scores','Empty integer array.']],['A threshold is policy applied after scoring.','Boundary equality needs an explicit test.'],
        'Thresholding changes the decision without retraining the score model. An operating threshold must be selected using validation/application costs, not final test labels.',
        String.raw`import numpy as np

def threshold_labels(scores,threshold):
    s=np.asarray(scores,dtype=float)
    if s.ndim!=1 or not np.isfinite(s).all() or ((s<0)|(s>1)).any() or not np.isfinite(threshold) or not 0<=threshold<=1: raise ValueError('Invalid probability')
    return (s>=threshold).astype(int)`,
        String.raw`np.testing.assert_array_equal(threshold_labels([0.2,0.5,0.9],0.5),[0,1,1])
assert threshold_labels([],0.5).size==0
for s,t in [([float('nan')],0.5),([1.1],0.5),([0.2],-1)]:
    try: threshold_labels(s,t)
    except ValueError: pass
    else: raise AssertionError('invalid score')`),
    task('Classification','Easy','positive-metrics','Compute positive-class precision and recall from paired labels',
        'Implement positive_metrics(y,pred) for equal nonempty 1D binary arrays. Return TP,FP,FN,precision,recall for positive class 1; use the explicit convention zero when a metric denominator is zero. Explain that the zero convention is reporting policy, not evidence of measured precision.',
        'Distinguish false positives from false negatives.',
        ['Validate labels are zero or one and aligned.','Calculate precision TP/(TP+FP), recall TP/(TP+FN).'],
        [['y=[1,1,0,0], pred=[1,0,1,0]','TP=1,FP=1,FN=1,precision=0.5,recall=0.5'],['no positive predictions','Precision reports zero under the declared convention.']],['Orient every confusion count using truth first.','Handle a zero denominator deliberately rather than dividing blindly.'],
        'Precision asks about selected positives and recall asks about actual positives. Returning the counts lets users see whether a metric was unsupported by positive examples.',
        String.raw`import numpy as np

def positive_metrics(y,pred):
    y=np.asarray(y); p=np.asarray(pred)
    if y.ndim!=1 or not y.size or p.shape!=y.shape or not np.isin(y,[0,1]).all() or not np.isin(p,[0,1]).all(): raise ValueError('Invalid labels')
    tp=int(((y==1)&(p==1)).sum()); fp=int(((y==0)&(p==1)).sum()); fn=int(((y==1)&(p==0)).sum())
    return tp,fp,fn,tp/(tp+fp) if tp+fp else 0.0,tp/(tp+fn) if tp+fn else 0.0`,
        String.raw`assert positive_metrics([1,1,0,0],[1,0,1,0])==(1,1,1,0.5,0.5)
assert positive_metrics([1,0],[0,0])==(0,0,1,0.0,0.0)
try: positive_metrics([2],[0])
except ValueError: pass
else: raise AssertionError('nonbinary label')`),
    task('Classification','Easy','balanced-accuracy','Compare ordinary and balanced accuracy on an imbalanced fixture',
        'Implement accuracy_pair(y,pred) returning accuracy and balanced accuracy for binary arrays containing both true classes. Balanced accuracy is the average recall of each class. Reject a one-class truth set under this exercise’s explicit reporting contract.',
        'Give both classes equal weight when assessing recall.',
        ['Validate paired binary vectors and require both classes in truth.','Do not use predicted class frequency to weight recalls.'],
        [['nine zeros and one one; predict all zero','Accuracy 0.9, balanced accuracy 0.5'],['perfect predictions for both classes','Both metrics 1.0']],['Compute recall separately on each true-class mask.','Balanced accuracy answers a different weighting question than population accuracy.'],
        'Ordinary accuracy weights each row equally. Averaging true-class recalls prevents the majority class size alone from dominating the reported recall summary; it still does not encode every business cost.',
        String.raw`import numpy as np

def accuracy_pair(y,pred):
    y=np.asarray(y); p=np.asarray(pred)
    if y.ndim!=1 or p.shape!=y.shape or set(y.tolist())!={0,1} or not np.isin(p,[0,1]).all(): raise ValueError('Both true classes required')
    return float((y==p).mean()),float(np.mean([(p[y==c]==c).mean() for c in (0,1)]))`,
        String.raw`assert accuracy_pair([0]*9+[1],[0]*10)==(0.9,0.5)
assert accuracy_pair([0,1],[0,1])==(1.0,1.0)
try: accuracy_pair([0,0],[0,0])
except ValueError: pass
else: raise AssertionError('unsupported one-class report')`),
    task('Classification','Medium','logistic-pipeline','Fit a scaled linear decision boundary on training data',
        'Implement train_logistic(x_train,y_train) returning a StandardScaler/LogisticRegression pipeline with random_state=0 and max_iter=1000. Use supplied binary training examples only. Demonstrate the decision boundary direction on a separable one-feature fixture without interpreting the tiny fixture’s score as real performance.',
        'Keep preprocessing and classifier fitting in one training-only pipeline.',
        ['Fit the scaler only on x_train.','Return the estimator so later validation can use predict_proba without refitting.'],
        [['training x negative has label 0, positive has label 1','Large positive held-out x receives greater class-1 probability.'],['held-out value far from training mean','Scaler mean remains the training mean.']],['Scaling affects a regularized linear boundary.','Use classes_ to interpret probability column order.'],
        'A pipeline applies the fitted training transform consistently at prediction. Binary probability output is a score estimate; a threshold and calibration policy still require separate validation.',
        String.raw`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def train_logistic(x_train,y_train):
    model=make_pipeline(StandardScaler(),LogisticRegression(random_state=0,max_iter=1000))
    return model.fit(x_train,y_train)`,
        String.raw`import numpy as np
m=train_logistic([[-3],[-2],[-1],[1],[2],[3]],[0,0,0,1,1,1])
p=m.predict_proba([[-10],[10]])[:,1]
assert p[0]<0.5<p[1]; np.testing.assert_allclose(m.named_steps['standardscaler'].mean_,[0])
assert m.named_steps['logisticregression'].classes_.tolist()==[0,1]`),
    task('Classification','Medium','balanced-weights','Compute class-balanced training weights without resampling holdouts',
        'Implement balanced_weights(y_train) returning one weight per training example: n_samples/(n_classes*class_count). Labels are a nonempty 1D binary vector containing both classes. Explain why weights come from training only and why validation/test data should not be duplicated to look balanced.',
        'Change training loss contributions without falsifying evaluation prevalence.',
        ['Use inverse frequency weights normalized by class count.','Require both classes and preserve input order.'],
        [['labels [0,0,0,1]','weights [2/3,2/3,2/3,2]'],['sum weights within each class','Equal total contribution under this formula.']],['A rare-class row receives greater weight.','Evaluation weighting must match a separately justified target population.'],
        'The formula gives each observed class half the total training weight. It is a loss-design choice, not a guarantee of calibrated deployment probabilities or a substitute for validating costs and prevalence.',
        String.raw`import numpy as np

def balanced_weights(y_train):
    y=np.asarray(y_train)
    if y.ndim!=1 or set(y.tolist())!={0,1}: raise ValueError('Both binary classes required')
    counts=np.bincount(y.astype(int),minlength=2)
    return len(y)/(2*counts[y.astype(int)])`,
        String.raw`w=balanced_weights([0,0,0,1]); np.testing.assert_allclose(w,[2/3,2/3,2/3,2])
assert np.isclose(w[:3].sum(),w[3]) and np.isclose(w.sum(),4)
try: balanced_weights([1,1])
except ValueError: pass
else: raise AssertionError('single class')`),
    task('Classification','Medium','threshold-cost','Choose a validation threshold using explicit error costs',
        'Implement choose_cost_threshold(y_val,scores,candidates,fp_cost,fn_cost) for valid binary truth, probabilities, and a nonempty threshold grid in [0,1]. Minimize FP*fp_cost+FN*fn_cost; ties choose the larger threshold. Return threshold and total validation cost, with no final-test labels available.',
        'Tune decisions according to declared costs on validation only.',
        ['Require finite nonnegative costs and a nonempty candidate grid.','Use score>=threshold and apply the documented deterministic tie rule.'],
        [['y=[1,0], scores=[0.4,0.6], thresholds [0.3,0.7], FP cost 1, FN cost 5','Choose 0.3 with cost 1.'],['all candidates have equal cost','Choose the largest candidate.']],['Calculate confusion events for each fixed candidate.','A validation optimum is a selection result, not an unbiased final score.'],
        'Explicit costs connect classification to a decision policy. The same validation data chooses the threshold, so independent final evaluation must assess that frozen choice.',
        String.raw`import numpy as np

def choose_cost_threshold(y_val,scores,candidates,fp_cost,fn_cost):
    y=np.asarray(y_val); s=np.asarray(scores,dtype=float); thresholds=list(candidates)
    if y.ndim!=1 or not y.size or y.shape!=s.shape or not np.isin(y,[0,1]).all() or not np.isfinite(s).all() or ((s<0)|(s>1)).any() or not thresholds or any(not np.isfinite(t) or not 0<=t<=1 for t in thresholds) or not np.isfinite([fp_cost,fn_cost]).all() or min(fp_cost,fn_cost)<0: raise ValueError('Invalid policy data')
    best=None
    for t in thresholds:
        p=s>=t; cost=float(((y==0)&p).sum()*fp_cost+((y==1)&~p).sum()*fn_cost)
        rank=(cost,-t)
        if best is None or rank<best[0]: best=(rank,float(t))
    return best[1],best[0][0]`,
        String.raw`assert choose_cost_threshold([1,0],[0.4,0.6],[0.3,0.7],1,5)==(0.3,1.0)
assert choose_cost_threshold([0,1],[0,1],[0.2,0.8],1,1)==(0.8,0.0)
try: choose_cost_threshold([1],[0.5],[],1,1)
except ValueError: pass
else: raise AssertionError('empty grid')`),
    task('Classification','Hard','recall-constraint','Select precision under a required validation recall floor',
        'Implement select_operating_point(y_val,scores,candidates,min_recall), assuming valid binary arrays/probabilities and a valid nonempty threshold grid. Require at least one positive label and min_recall in (0,1]. Among feasible candidates maximize precision, then threshold; return None if no candidate reaches the floor.',
        'Express a constrained operating policy instead of optimizing one unconstrained metric.',
        ['Use inclusive thresholding and reject a truth vector with no positives.','Select using validation only and return precision/recall with the threshold.'],
        [['y=[1,1,0], scores=[0.9,0.4,0.6], candidates [0.3,0.8], recall floor 1','Choose 0.3 with precision 2/3, recall 1.'],['candidate 0.8 alone under recall floor 1','None, because recall is only 0.5.']],['Filter feasible points before ranking precision.','A recall target estimated on few positives has substantial uncertainty.'],
        'Constraint handling makes an infeasible policy explicit rather than quietly returning a high-precision low-recall point. A validation guarantee is not a certainty about future recall, especially under rare positives or distribution shift.',
        String.raw`import numpy as np

def select_operating_point(y_val,scores,candidates,min_recall):
    y=np.asarray(y_val); s=np.asarray(scores)
    if not 0<min_recall<=1 or not (y==1).any(): raise ValueError('Positive support required')
    feasible=[]
    for t in candidates:
        p=s>=t; tp=int(((y==1)&p).sum()); recall=tp/int((y==1).sum()); precision=tp/int(p.sum()) if p.any() else 0.0
        if recall>=min_recall: feasible.append((precision,float(t),recall))
    if not feasible: return None
    precision,t,recall=max(feasible)
    return t,precision,recall`,
        String.raw`assert select_operating_point([1,1,0],[0.9,0.4,0.6],[0.3,0.8],1)==(0.3,2/3,1.0)
assert select_operating_point([1,1,0],[0.9,0.4,0.6],[0.8],1) is None
try: select_operating_point([0,0],[0.1,0.2],[0.5],1)
except ValueError: pass
else: raise AssertionError('no positive support')`),
    task('Classification','Hard','stable-logistic-loss','Compute logistic loss directly from extreme logits',
        'Implement binary_logit_loss(y,logits) returning mean negative log likelihood for nonempty equal 1D arrays with binary labels and finite logits. Avoid computing log(sigmoid) directly for large-magnitude values, and retain confidently wrong predictions as large finite penalties.',
        'Use a numerically stable logistic-loss identity.',
        ['Use logaddexp rather than exp followed by log of saturated probabilities.','Reject shape/label violations and evaluate extreme fixtures without overflow.'],
        [['y=[0,1], logits=[0,0]','log(2)'],['y=[0], logits=[1000]','Approximately 1000, not NaN or an accidentally zero penalty.']],['Softplus(z)-y*z is binary log loss.','np.logaddexp(0,z) computes softplus stably.'],
        'Working in logit space avoids probability saturation turning a valid loss into log(0). The loss rewards correct probabilities, but low log loss alone does not prove adequate subgroup performance or a chosen threshold policy.',
        String.raw`import numpy as np

def binary_logit_loss(y,logits):
    y=np.asarray(y); z=np.asarray(logits,dtype=float)
    if y.ndim!=1 or not y.size or z.shape!=y.shape or not np.isin(y,[0,1]).all() or not np.isfinite(z).all(): raise ValueError('Invalid inputs')
    return float(np.mean(np.logaddexp(0,z)-y*z))`,
        String.raw`assert np.isclose(binary_logit_loss([0,1],[0,0]),np.log(2))
with np.errstate(over='raise',invalid='raise'):
    assert np.isclose(binary_logit_loss([0],[1000]),1000)
    assert binary_logit_loss([0,1],[-1000,1000])<1e-10
try: binary_logit_loss([2],[0])
except ValueError: pass
else: raise AssertionError('invalid label')`),
    task('Classification','Hard','cost-matrix','Choose a multiclass action by expected loss rather than argmax',
        'Implement minimum_cost_actions(probabilities,cost_matrix), where rows of the square cost matrix are true classes and columns are decisions. Require finite nonnegative values and probability rows summing approximately one. Return the lowest-index minimum expected-cost action for each row.',
        'Translate probability estimates into cost-sensitive decisions.',
        ['Compute expected action costs with probabilities @ cost_matrix.','Validate dimensions and nonnegative finite probabilities/costs; ties choose first action.'],
        [['p=[0.8,0.2], costs [[0,1],[10,0]]','Choose action 1 because expected costs are [2,0.8].'],['Equal expected costs','Choose action index 0.']],['Argmax is optimal for a particular symmetric zero-one loss, not every cost matrix.','Matrix orientation must match the definition of true and decision classes.'],
        'Probability-weighted costs encode consequences instead of assuming all mistakes are equivalent. This policy depends on meaningful probability estimates and a justified cost matrix; both need independent validation.',
        String.raw`import numpy as np

def minimum_cost_actions(probabilities,cost_matrix):
    p=np.asarray(probabilities,dtype=float); c=np.asarray(cost_matrix,dtype=float)
    if p.ndim!=2 or c.ndim!=2 or c.shape[0]==0 or c.shape!=(p.shape[1],p.shape[1]) or not np.isfinite(p).all() or not np.isfinite(c).all() or (p<0).any() or (c<0).any() or not np.allclose(p.sum(axis=1),1): raise ValueError('Invalid probabilities/costs')
    return np.argmin(p@c,axis=1)`,
        String.raw`assert minimum_cost_actions([[0.8,0.2]],[[0,1],[10,0]]).tolist()==[1]
assert minimum_cost_actions([[0.5,0.5]],[[0,1],[1,0]]).tolist()==[0]
assert minimum_cost_actions(np.empty((0,2)),[[0,1],[1,0]]).size==0
try: minimum_cost_actions([[0.8,0.8]],[[0,1],[1,0]])
except ValueError: pass
else: raise AssertionError('unnormalized probability')`),
    task('Clustering','Easy','squared-distance','Measure feature-space distance',
        'A warehouse groups two-dimensional shipment summaries. Implement squared Euclidean distance between two nonempty, equally shaped numeric vectors. Explain why changing a feature from kilograms to grams can change the neighborhood even though the shipments are unchanged.',
        'Compute squared distance and recognize its sensitivity to units.',
        ['Accept aligned one-dimensional vectors; reject mismatched or empty vectors.','Return the sum of squared coordinate differences without modifying either input.'],
        [['[1,2] and [4,6]','25'],['Identical vectors','0']],
        ['Subtract coordinate by coordinate before squaring.','A unit conversion multiplies that feature’s squared contribution by the square of the conversion factor.'],
        'Squared Euclidean distance sums independent coordinate contributions. It preserves nearest-center rankings for Euclidean distance, but heavily weighted units can dominate. Choose feature scaling from the domain and fit any learned scaling on training data.',
        String.raw`import numpy as np
def squared_distance(a,b):
    a,b=np.asarray(a,dtype=float),np.asarray(b,dtype=float)
    if a.ndim!=1 or a.size==0 or a.shape!=b.shape: raise ValueError('Aligned nonempty vectors required')
    return float(np.sum((a-b)**2))`,
        String.raw`assert squared_distance([1,2],[4,6])==25
assert squared_distance([2],[2])==0
try: squared_distance([],[])
except ValueError: pass
else: raise AssertionError('empty vector')`),
    task('Clustering','Easy','nearest-center','Assign shipments to fixed centers',
        'Given a matrix of shipment features and a nonempty matrix of fixed cluster centers with the same feature width, assign each shipment to its nearest center using squared Euclidean distance. On a distance tie choose the smallest center index. Support an empty shipment batch.',
        'Separate the assignment step from fitting cluster centers.',
        ['Return one integer label per row; centers must have matching feature width.','Resolve ties deterministically and support zero input rows.'],
        [['Rows [[0],[5],[10]], centers [[0],[10]]','Labels [0,0,1]'],['No rows and two one-dimensional centers','An empty integer array']],
        ['Broadcast rows against centers to obtain row-by-center distances.','argmin returns the first minimum, making the tie policy explicit.'],
        'Assignment minimizes within-cluster squared distance for fixed centers. Labels are arbitrary indices rather than semantic categories. This implementation materializes the distance tensor, so large datasets require chunking rather than unrestricted broadcasting.',
        String.raw`import numpy as np
def assign_clusters(x,centers):
    x,c=np.asarray(x,dtype=float),np.asarray(centers,dtype=float)
    if x.ndim!=2 or c.ndim!=2 or len(c)==0 or x.shape[1]!=c.shape[1]: raise ValueError('Matching matrices required')
    return np.argmin(((x[:,None,:]-c[None,:,:])**2).sum(axis=2),axis=1)`,
        String.raw`assert assign_clusters([[0],[5],[10]],[[0],[10]]).tolist()==[0,0,1]
assert assign_clusters(np.empty((0,1)),[[0],[10]]).size==0`),
    task('Clustering','Easy','centroid-update','Update centers with an empty cluster',
        'Implement the center-update step of Lloyd’s algorithm for fixed integer labels. Average the rows assigned to each center. An empty cluster must retain its previous center, and neither features nor the previous-center matrix may be mutated. Assume finite numeric matrices and valid labels.',
        'Understand the mean update and define an explicit empty-cluster policy.',
        ['Average each nonempty cluster independently.','Preserve previous centers for empty clusters and return a new matrix.'],
        [['Rows [[0],[2],[10]], labels [0,0,1], previous [[0],[8],[20]]','Centers [[1],[10],[20]]'],['No rows, previous [[4]]','Center [[4]] retained']],
        ['Start with a floating-point copy of the previous centers.','Only replace a center when its boolean membership mask contains a row.'],
        'For fixed assignments, the arithmetic mean minimizes squared Euclidean error. Empty clusters have no defined sample mean; retaining the previous center avoids NaNs but may leave an unused cluster. Production algorithms may instead reseed using a documented policy.',
        String.raw`import numpy as np
def update_centers(x,labels,previous):
    x=np.asarray(x,dtype=float); labels=np.asarray(labels); result=np.array(previous,dtype=float,copy=True)
    for k in range(len(result)):
        members=x[labels==k]
        if len(members): result[k]=members.mean(axis=0)
    return result`,
        String.raw`p=np.array([[0.],[8.],[20.]])
assert np.allclose(update_centers([[0],[2],[10]],[0,0,1],p),[[1],[10],[20]])
assert np.allclose(p,[[0],[8],[20]])
assert np.allclose(update_centers(np.empty((0,1)),np.array([],dtype=int),[[4]]),[[4]])`),
    task('Clustering','Medium','scaled-kmeans','Fit a reproducible clustering pipeline',
        'Operational features mix request count and latency units. Return a fitted StandardScaler → KMeans pipeline using only the supplied training rows. Accept a requested number of clusters, use ten initializations and a fixed random seed, and keep prediction preprocessing inside the fitted pipeline.',
        'Fit scaling and clustering together without learning from future prediction rows.',
        ['Use StandardScaler followed by KMeans(n_init=10, random_state=7).','Fit only training rows; expose predict for later rows without refitting.'],
        [['Training [[0,0],[0,2],[10,10],[10,12]], k=2','First pair shares one cluster; second pair shares a different cluster'],['Predict [[100,100]] after fitting','Scaler mean remains [5,6]']],
        ['Construct a sklearn Pipeline so predict reuses fitted scaling.','Compare membership relationships rather than expecting a particular numeric cluster label.'],
        'Scaling changes the clustering geometry and must reflect the intended feature importance. A pipeline makes that choice reproducible. Fixing a seed and initialization count reduces run-to-run variation; it does not prove that the discovered groups are meaningful business segments.',
        String.raw`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
def fit_scaled_kmeans(train,k):
    return Pipeline([('scale',StandardScaler()),('cluster',KMeans(n_clusters=k,n_init=10,random_state=7))]).fit(train)`,
        String.raw`model=fit_scaled_kmeans([[0,0],[0,2],[10,10],[10,12]],2)
labels=model.predict([[0,0],[0,2],[10,10],[10,12]])
assert labels[0]==labels[1] and labels[2]==labels[3] and labels[0]!=labels[2]
model.predict([[100,100]])
assert np.allclose(model.named_steps['scale'].mean_,[5,6])`),
    task('Clustering','Medium','cluster-inertia','Audit a reported inertia value',
        'A clustering report lists centers and row assignments. Independently compute its inertia: the sum of squared distances from each row to its assigned center. Assume aligned finite matrices and valid integer cluster labels. Explain why inertia alone cannot choose between different values of k.',
        'Check a clustering objective without confusing it with segmentation quality.',
        ['Compute a sum, not an average or square-root distance.','Return zero for an empty row matrix with valid feature width.'],
        [['Rows [[0],[2],[9]], labels [0,0,1], centers [[1],[10]]','Inertia 3'],['Empty rows','Inertia 0']],
        ['Index centers by each row’s assigned label.','Increasing the number of centers cannot increase the globally optimal training inertia.'],
        'Inertia measures compactness in the chosen feature space. More centers can drive training inertia toward zero, including the unhelpful one-center-per-row solution. Use domain usefulness, stability, and other diagnostics when comparing cluster counts.',
        String.raw`import numpy as np
def cluster_inertia(x,labels,centers):
    x=np.asarray(x,dtype=float); labels=np.asarray(labels,dtype=int); centers=np.asarray(centers,dtype=float)
    return float(np.sum((x-centers[labels])**2))`,
        String.raw`assert cluster_inertia([[0],[2],[9]],[0,0,1],[[1],[10]])==3
assert cluster_inertia(np.empty((0,1)),[],[[1]])==0`),
    task('Clustering','Medium','silhouette-guard','Guard an undefined silhouette report',
        'A dashboard receives arbitrary clustering labels, including single-cluster outputs and one cluster per row. Implement a silhouette wrapper that returns None when the score is undefined because the number of distinct labels is outside 2 through n−1. Otherwise return sklearn’s Euclidean silhouette score.',
        'Handle mathematically undefined cluster evaluation explicitly.',
        ['Check the number of distinct labels before invoking silhouette_score.','Keep undefined scores separate from legitimate negative or zero scores.'],
        [['[[0],[1],[10],[11]], labels [0,0,1,1]','A silhouette score greater than 0.8'],['Four rows with labels [0,0,0,0] or [0,1,2,3]','None']],
        ['A single cluster has no competing cluster distance.','Returning zero would misrepresent an undefined score as a valid observation.'],
        'Silhouette compares within-cluster distance against the nearest other-cluster distance. It requires at least two clusters and fewer clusters than samples. Its preference for compact separated geometry is a modeling assumption, not evidence of causal or business meaning.',
        String.raw`import numpy as np
from sklearn.metrics import silhouette_score
def silhouette_checked(x,labels):
    count=len(np.unique(labels)); n=len(labels)
    if not 2<=count<n: return None
    return float(silhouette_score(x,labels,metric='euclidean'))`,
        String.raw`assert silhouette_checked([[0],[1],[10],[11]],[0,0,1,1])>0.8
assert silhouette_checked([[0],[1]],[0,0]) is None
assert silhouette_checked([[0],[1]],[0,1]) is None`),
    task('Clustering','Hard','select-cluster-count','Select an exploratory cluster count',
        'Build an exploratory segmentation selector for a finite training matrix and candidate k values. Standardize training features once, fit deterministic KMeans for each unique candidate in [2,n−1], discard degenerate single-cluster results, and maximize silhouette with smaller k winning exact ties. Return k and its score, or None if no candidate is usable.',
        'Compare unsupervised candidates with explicit validity and selection policies.',
        ['Use training-only StandardScaler and KMeans with ten initializations and seed 7.','Return the highest silhouette candidate; do not describe its selected training score as independent generalization evidence.'],
        [['Two tight, widely separated groups and candidates [1,2,n]','k=2 with a high silhouette'],['Candidates contain only 1 and n','None']],
        ['Filter impossible k values before fitting.','A selected internal metric is optimistic; separately investigate stability and business value.'],
        'Candidate selection uses a compactness/separation diagnostic on exploratory training data. This is useful for generating a segmentation hypothesis but is not supervised test accuracy. Document feature geometry and inspect independent future data or stability before operational use.',
        String.raw`import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
def select_cluster_count(train,candidates):
    z=StandardScaler().fit_transform(train); results=[]
    for k in sorted(set(candidates)):
        if not 2<=k<len(z): continue
        labels=KMeans(n_clusters=k,n_init=10,random_state=7).fit_predict(z)
        if len(np.unique(labels))<2: continue
        results.append((float(silhouette_score(z,labels)),k))
    if not results: return None
    score,k=max(results,key=lambda item:(item[0],-item[1]))
    return k,score`,
        String.raw`x=[[0],[0.1],[0.2],[10],[10.1],[10.2]]
k,score=select_cluster_count(x,[1,2,6])
assert k==2 and score>0.95
assert select_cluster_count(x,[1,6]) is None`),
    task('Clustering','Hard','permutation-stability','Measure label-permutation-invariant stability',
        'Two clustering runs label the same observations with different numeric cluster IDs. Implement a stability function using adjusted Rand index, validating equal nonempty one-dimensional label arrays. Report perfect agreement for equivalent partitions even when IDs are permuted. Explain why stability alone does not establish useful clusters.',
        'Evaluate partition agreement without treating arbitrary cluster IDs as classes.',
        ['Return adjusted Rand index for aligned observations.','Reject empty or differently shaped labels; do not align by sorting cluster IDs.'],
        [['[0,0,1,1] and [7,7,3,3]','1.0'],['[0,0,1,1] and [0,1,0,1]','A negative adjusted Rand index']],
        ['ARI compares observation pairs rather than numeric label values.','A consistently bad partition can still be stable.'],
        'Adjusted Rand index corrects pairwise partition agreement for chance under its reference model and is invariant to cluster-name permutations. It can be negative. Evaluate it on the same observations, and combine stability with geometry, sensitivity, and domain relevance.',
        String.raw`import numpy as np
from sklearn.metrics import adjusted_rand_score
def partition_stability(a,b):
    a,b=np.asarray(a),np.asarray(b)
    if a.ndim!=1 or a.size==0 or a.shape!=b.shape: raise ValueError('Aligned nonempty labels required')
    return float(adjusted_rand_score(a,b))`,
        String.raw`assert partition_stability([0,0,1,1],[7,7,3,3])==1
assert partition_stability([0,0,1,1],[0,1,0,1])<0
try: partition_stability([],[])
except ValueError: pass
else: raise AssertionError('empty labels')`),
    task('Clustering','Hard','manual-silhouette','Implement silhouette with singleton handling',
        'For a small diagnostic dataset, implement mean Euclidean silhouette directly rather than calling sklearn’s metric. For each nonsingleton row calculate mean distance to other rows in its own cluster and the smallest mean distance to another cluster. A singleton row contributes zero; if both distances are zero its contribution is zero. Reject fewer than two clusters or one cluster per row.',
        'Derive a cluster diagnostic and handle its degenerate cases correctly.',
        ['Exclude the row itself from its within-cluster average.','Use (b−a)/max(a,b), with documented singleton and zero-distance handling.'],
        [['Rows [[0],[2],[10],[12]], labels [0,0,1,1]','Matches sklearn silhouette_score'],['Rows [[0],[2],[10]], labels [0,0,1]','Singleton contributes zero']],
        ['Build a pairwise Euclidean distance matrix; this costs quadratic memory.','The nearest competing cluster is chosen by mean distance, not by the nearest individual point.'],
        'Silhouette is defined per observation before averaging. Excluding the diagonal matters for small clusters, and singleton contributions follow the zero convention. This reference is quadratic and intended for diagnostics; production evaluation may require sampling or chunked distances.',
        String.raw`import numpy as np
def manual_silhouette(x,labels):
    x=np.asarray(x,dtype=float); labels=np.asarray(labels); groups=np.unique(labels); n=len(labels)
    if not 2<=len(groups)<n: raise ValueError('Require 2 through n-1 clusters')
    distances=np.sqrt(((x[:,None,:]-x[None,:,:])**2).sum(axis=2)); values=[]
    for i,label in enumerate(labels):
        own=(labels==label); own[i]=False
        if not own.any(): values.append(0.0); continue
        a=distances[i,own].mean()
        b=min(distances[i,labels==other].mean() for other in groups if other!=label)
        values.append((b-a)/max(a,b) if max(a,b)>0 else 0.0)
    return float(np.mean(values))`,
        String.raw`from sklearn.metrics import silhouette_score
for x,labels in [([[0],[2],[10],[12]],[0,0,1,1]),([[0],[2],[10]],[0,0,1]),([[0],[0],[0]],[0,0,1])]:
    assert np.isclose(manual_silhouette(x,labels),silhouette_score(x,labels))
try: manual_silhouette([[0],[1]],[0,1])
except ValueError: pass
else: raise AssertionError('undefined metric')`),
    task('Feature Engineering','Easy','median-imputation','Fill missing readings from training data',
        'A sensor column contains missing readings. Implement training-median imputation for a later batch and return both the filled batch and its original missing-value indicator. Reject a training column with no observed values. Never calculate a replacement using the later batch.',
        'Preserve missingness information while learning imputation exclusively from training data.',
        ['Calculate the median from observed training values only.','Return filled values plus a boolean missing indicator without mutating inputs.'],
        [['Train [1,3,NaN], later [NaN,100]','Filled [2,100], indicator [true,false]'],['Training [NaN,NaN]','ValueError']],
        ['Use isnan to separate observed training values.','An indicator can capture informative missingness but may itself drift in deployment.'],
        'Imputation statistics are learned preprocessing parameters. Deriving them from validation or test rows leaks information about the evaluation distribution. An explicit indicator distinguishes an imputed median from a genuinely observed median; all-missing training columns need a deliberate policy.',
        String.raw`import numpy as np
def impute_readings(train,later):
    train=np.asarray(train,dtype=float); later=np.asarray(later,dtype=float)
    observed=train[~np.isnan(train)]
    if observed.size==0: raise ValueError('No observed training values')
    missing=np.isnan(later)
    return np.where(missing,np.median(observed),later),missing`,
        String.raw`values,missing=impute_readings([1,3,np.nan],[np.nan,100])
assert np.allclose(values,[2,100]) and missing.tolist()==[True,False]
try: impute_readings([np.nan,np.nan],[1])
except ValueError: pass
else: raise AssertionError('undefined median')`),
    task('Feature Engineering','Easy','unknown-categories','Encode an unseen service category',
        'Fit a one-column OneHotEncoder on training service names and transform later service names. Return the fitted encoder and dense later matrix. An unseen category must produce an all-zero row rather than crashing or learning a new validation category. Explain why category order must come from the fitted encoder.',
        'Keep categorical vocabulary and column order stable across training and inference.',
        ['Use handle_unknown="ignore" and a dense output matrix.','Fit on training categories only; expose categories_ for interpreting columns.'],
        [['Train [api,web], later [worker,api]','Unknown row all zeros; api row has one active column'],['Later values repeat a known category','The same encoded column is active each time']],
        ['Reshape the string list to a one-column matrix.','Do not independently call get_dummies on each data split.'],
        'A fitted encoder defines the model’s feature schema. Ignoring unknown categories preserves width, but all-zero unknown rows may require monitoring or an explicit unknown bucket. The reference uses the scikit-learn sparse_output argument available from version 1.2.',
        String.raw`import numpy as np
from sklearn.preprocessing import OneHotEncoder
def encode_services(train,later):
    encoder=OneHotEncoder(handle_unknown='ignore',sparse_output=False)
    encoder.fit(np.asarray(train).reshape(-1,1))
    return encoder,encoder.transform(np.asarray(later).reshape(-1,1))`,
        String.raw`encoder,z=encode_services(['api','web'],['worker','api','api'])
assert z.shape==(3,2) and z[0].sum()==0 and z[1].sum()==1
assert np.array_equal(z[1],z[2]) and encoder.categories_[0].tolist()==['api','web']`),
    task('Feature Engineering','Easy','train-standardization','Standardize without refitting the holdout',
        'Implement a helper returning a StandardScaler fitted on a numeric training matrix and the transformed validation matrix. A constant training feature must remain finite. Demonstrate with a distant validation value that training means remain unchanged rather than being recomputed from validation data.',
        'Apply a learned numeric transformation consistently to held-out observations.',
        ['Fit the scaler exclusively on training rows.','Return the fitted scaler and transformed validation rows with unchanged feature width.'],
        [['Train [[0,7],[2,7]], validation [[10,7]]','Transformed [[9,0]], mean [1,7]'],['Constant training feature','Finite transformed values']],
        ['Call fit on training data, then transform on validation data.','StandardScaler uses population variance and a unit scale for constant columns.'],
        'Standardization centers by the training mean and scales by the training standard deviation. Calling fit_transform separately on validation changes the coordinate system and leaks evaluation statistics. A fitted scaler belongs with the trained model artifact.',
        String.raw`from sklearn.preprocessing import StandardScaler
def standardize_holdout(train,validation):
    scaler=StandardScaler().fit(train)
    return scaler,scaler.transform(validation)`,
        String.raw`scaler,z=standardize_holdout([[0,7],[2,7]],[[10,7]])
assert np.allclose(scaler.mean_,[1,7]) and np.allclose(z,[[9,0]])
assert np.isfinite(z).all()`),
    task('Feature Engineering','Medium','mixed-pipeline','Assemble mixed-feature regression safely',
        'A pricing model receives a DataFrame with numeric age, categorical region, and a target supplied separately. Build a fitted regression pipeline: median-impute and standardize age, most-frequent-impute and one-hot encode region with unknown handling, then Ridge(alpha=1). Do not include the target in the feature frame.',
        'Compose heterogeneous preprocessing inside the fitted estimator boundary.',
        ['Use ColumnTransformer with separate numeric and categorical pipelines.','Fit the complete pipeline on training data and predict rows with missing age or unseen region.'],
        [['Age [1,2,3,4], regions [a,a,b,b], prices [2,4,6,8]','A fitted pipeline producing finite predictions'],['Later age NaN, region new','A finite prediction without adding a category']],
        ['Wrap imputation and scaling inside the numeric branch.','Use handle_unknown="ignore" in the categorical branch and keep transformations inside CV when tuning.'],
        'ColumnTransformer preserves a consistent schema while a Pipeline prevents preprocessing outside the training fold. Ridge consumes the transformed features. The supplied reference assumes named columns age and region and represents missing numeric values with NaN; deployment should validate that schema.',
        String.raw`from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler,OneHotEncoder
from sklearn.linear_model import Ridge
def fit_price_pipeline(train,y):
    numeric=Pipeline([('impute',SimpleImputer(strategy='median')),('scale',StandardScaler())])
    categorical=Pipeline([('impute',SimpleImputer(strategy='most_frequent')),('encode',OneHotEncoder(handle_unknown='ignore',sparse_output=False))])
    prep=ColumnTransformer([('numeric',numeric,['age']),('category',categorical,['region'])])
    return Pipeline([('prepare',prep),('model',Ridge(alpha=1.0))]).fit(train,y)`,
        String.raw`import pandas as pd
train=pd.DataFrame({'age':[1.,2.,3.,4.],'region':['a','a','b','b']})
model=fit_price_pipeline(train,[2,4,6,8])
assert np.isfinite(model.predict(pd.DataFrame({'age':[np.nan],'region':['new']}))).all()
assert model.named_steps['prepare'].named_transformers_['numeric'].named_steps['impute'].statistics_[0]==2.5`),
    task('Feature Engineering','Medium','variance-selection','Remove constant features using training statistics',
        'A telemetry table contains a training-constant device flag that varies only in validation. Fit VarianceThreshold(threshold=0) on training rows and transform later rows using its selected columns. Return the selector and transformed rows; a validation-only variation must not rescue a training-constant column.',
        'Select features using training statistics without peeking at held-out variability.',
        ['Fit VarianceThreshold only on training rows and return its support mask.','Retain training-varying features in original column order.'],
        [['Train [[1,0,5],[2,0,6]], later [[10,9,8]]','Support [true,false,true], transformed [[10,8]]'],['All training features constant','The sklearn ValueError is propagated']],
        ['Training variance determines support; validation variance is irrelevant.','Feature selection must also be refitted inside each CV training fold.'],
        'Variance filtering is an unsupervised selection rule but still learns from data. Fitting it globally before cross-validation reveals held-out distribution information. Low variance is not the same as low predictive usefulness, so a nonzero threshold requires domain justification.',
        String.raw`from sklearn.feature_selection import VarianceThreshold
def remove_constants(train,later):
    selector=VarianceThreshold(threshold=0).fit(train)
    return selector,selector.transform(later)`,
        String.raw`s,z=remove_constants([[1,0,5],[2,0,6]],[[10,9,8]])
assert s.get_support().tolist()==[True,False,True] and z.tolist()==[[10,8]]
try: remove_constants([[1,1],[1,1]],[[2,3]])
except ValueError: pass
else: raise AssertionError('all-constant features')`),
    task('Feature Engineering','Medium','cyclical-hours','Encode a daily cycle without a midnight jump',
        'Encode integer hours 0 through 23 into sine and cosine coordinates in that order. Reject values outside this range and noninteger inputs. Show that 23:00 is as close to midnight as 01:00, while preserving a distinct representation for noon.',
        'Represent a periodic variable with an appropriate continuous geometry.',
        ['Return an n-by-2 floating-point matrix using angle 2πh/24.','Validate integer hour values; do not infer a period from the observed batch.'],
        [['Hours [0,6,12]','Coordinates approximately [[0,1],[1,0],[0,-1]]'],['Hours 23 and 1 relative to 0','Equal Euclidean distances']],
        ['A single sine coordinate confuses some different hours; use both coordinates.','The 24-hour period is domain knowledge, not a fitted sample maximum.'],
        'Circular coordinates remove the artificial discontinuity between hour 23 and hour 0. They impose a smooth periodic geometry; sharp operational transitions may still need additional features. This encoding uses no target information and has a fixed, documented period.',
        String.raw`import numpy as np
def encode_hours(hours):
    h=np.asarray(hours,dtype=float)
    if h.ndim!=1 or not np.isfinite(h).all() or ((h<0)|(h>=24)|(h!=np.floor(h))).any(): raise ValueError('Integer hours 0..23 required')
    angle=2*np.pi*h/24
    return np.column_stack([np.sin(angle),np.cos(angle)])`,
        String.raw`assert np.allclose(encode_hours([0,6,12]),[[0,1],[1,0],[0,-1]],atol=1e-12)
z=encode_hours([23,0,1]); assert np.isclose(np.linalg.norm(z[0]-z[1]),np.linalg.norm(z[2]-z[1]))
try: encode_hours([24])
except ValueError: pass
else: raise AssertionError('invalid hour')`),
    task('Feature Engineering','Hard','out-of-fold-encoding','Build leakage-resistant target encodings',
        'For regression categories and numeric targets, construct out-of-fold mean encodings using three shuffled KFold splits with seed 4. Each held-out fold must use category means and a global fallback computed only from its training fold. Also encode later categories using full-training means and a full-training global fallback. Assume at least three aligned observations.',
        'Exclude each validation fold’s labels from its target-derived features.',
        ['Return training out-of-fold encodings and later encodings in original order.','Unseen categories use the corresponding training-fold mean, never the held-out target or overall OOF target mean.'],
        [['Each training category is unique','Every OOF value equals its fold-training global mean'],['Training categories [a,a,b], targets [1,3,8]; later [a,new]','Later values [2,4]']],
        ['Create the mapping inside the fold loop, not before it.','When used inside model selection, this entire procedure must stay inside each outer training fold.'],
        'Target encoding can expose the answer when a row contributes its own target. Cross-fitting removes direct fold-label access; regularization and grouping or temporal splits may still be necessary. OOF training features and full-training inference mappings have different statistical properties, so validate the full strategy honestly.',
        String.raw`import numpy as np
from sklearn.model_selection import KFold
def target_encode(categories,y,later):
    categories=np.asarray(categories); y=np.asarray(y,dtype=float); later=np.asarray(later)
    def transform(train_indices,values):
        cats=categories[train_indices]; targets=y[train_indices]
        mapping={c:targets[cats==c].mean() for c in np.unique(cats)}
        prior=targets.mean()
        return np.array([mapping.get(c,prior) for c in values],dtype=float)
    oof=np.empty(len(y))
    for train,valid in KFold(3,shuffle=True,random_state=4).split(y):
        oof[valid]=transform(train,categories[valid])
    return oof,transform(np.arange(len(y)),later)`,
        String.raw`from sklearn.model_selection import KFold
cats=np.array(list('abcdef')); y=np.arange(6,dtype=float)
oof,_=target_encode(cats,y,['new'])
for train,valid in KFold(3,shuffle=True,random_state=4).split(y): assert np.allclose(oof[valid],y[train].mean())
_,later=target_encode(['a','a','b'],[1,3,8],['a','new'])
assert np.allclose(later,[2,4])`),
    task('Feature Engineering','Hard','fold-local-selection','Tune feature count without a global selection leak',
        'Build a regression GridSearchCV that selects between one and two features using f_regression, standardizes the selected columns, and fits Ridge(alpha=1). Put all three steps inside the estimator pipeline. Use shuffled three-fold KFold with seed 5 and negative mean squared error; return the fitted search on training data only.',
        'Refit supervised feature selection independently inside every model-selection fold.',
        ['Use SelectKBest(f_regression) within Pipeline and search select__k over [1,2].','Use error_score="raise" and leave any external test data outside the function.'],
        [['Thirty rows with one strong linear feature and two nuisance features','A fitted search with k chosen from [1,2]'],['Predict new rows after tuning','Finite predictions using the refitted training pipeline']],
        ['Selecting features before GridSearchCV leaks validation labels.','The best CV score is used for selection; an outer test or nested CV is required for unbiased evaluation of the procedure.'],
        'Supervised selection learns from both features and labels. Embedding it in a pipeline makes GridSearchCV refit it on each training fold. The final best estimator is refitted on all supplied training data; its selected CV score is not an independent test result.',
        String.raw`from sklearn.feature_selection import SelectKBest,f_regression
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV,KFold
def tune_feature_count(x,y):
    pipeline=Pipeline([('select',SelectKBest(f_regression)),('scale',StandardScaler()),('model',Ridge(alpha=1.0))])
    return GridSearchCV(pipeline,{'select__k':[1,2]},cv=KFold(3,shuffle=True,random_state=5),scoring='neg_mean_squared_error',error_score='raise').fit(x,y)`,
        String.raw`rng=np.random.RandomState(2); x=rng.normal(size=(30,3)); y=3*x[:,0]+rng.normal(scale=0.1,size=30)
search=tune_feature_count(x,y)
assert search.best_params_['select__k'] in [1,2]
assert search.best_estimator_.named_steps['select'].n_features_in_==3
assert np.isfinite(search.predict(x[:2])).all() and len(search.cv_results_['params'])==2`),
    task('Feature Engineering','Hard','historical-lags','Create strictly historical customer features',
        'A table has customer, time, and value columns with unique customer-time pairs. Build a feature equal to the previous observed value for the same customer, preserving original row order and leaving the first value per customer missing. The current row’s value must never enter its feature. Assume timestamps represent actual feature availability, not merely event occurrence.',
        'Construct an as-of historical feature without using current or future observations.',
        ['Sort within customer by time before applying a one-row group shift.','Return an array aligned with original positions, including when the DataFrame index contains duplicates.'],
        [['Rows (a,2,20),(b,1,7),(a,1,10),(a,3,30)','Previous values [10,NaN,NaN,20]'],['A customer has only one observation','Its historical feature is missing']],
        ['Store a positional row identifier before sorting.','A historical backfill is valid only if those values were actually available at the prediction time.'],
        'Groupwise shift prevents the current target-like observation from leaking into its own historical feature. Positional alignment avoids subtle index bugs after sorting. Real systems also need availability timestamps, late-arrival handling, and chronological evaluation; event time alone may not establish availability.',
        String.raw`import numpy as np
import pandas as pd
def previous_customer_value(frame):
    ordered=frame[['customer','time','value']].copy()
    ordered['_position']=np.arange(len(ordered))
    ordered=ordered.sort_values(['customer','time'])
    ordered['_lag']=ordered.groupby('customer')['value'].shift(1)
    return ordered.sort_values('_position')['_lag'].to_numpy()`,
        String.raw`import pandas as pd
frame=pd.DataFrame({'customer':['a','b','a','a'],'time':[2,1,1,3],'value':[20,7,10,30]},index=[0,0,0,0])
assert np.allclose(previous_customer_value(frame),[10,np.nan,np.nan,20],equal_nan=True)
assert frame.columns.tolist()==['customer','time','value']`),
    task('Model Evaluation','Easy','binary-confusion','Keep confusion-matrix axes explicit',
        'An incident detector uses label 1 for an incident and 0 otherwise. Return a two-by-two confusion matrix with rows representing actual [0,1] and columns representing predicted [0,1], even when one class is absent. Reject empty, misaligned, or nonbinary input labels.',
        'Calculate consistent confusion counts without swapping false positives and false negatives.',
        ['Always return [[TN,FP],[FN,TP]] using an explicit label order.','Reject invalid labels and mismatched one-dimensional arrays.'],
        [['Actual [0,0,1,1], predicted [0,1,0,1]','[[1,1],[1,1]]'],['Actual [0,0], predicted [0,0]','[[2,0],[0,0]]']],
        ['Pass labels=[0,1] to keep the output shape fixed.','A missed incident is a false negative: actual 1, prediction 0.'],
        'A confusion matrix records threshold-dependent decisions. Fixed axis labels prevent changes in shape or interpretation when a batch lacks one class. Counts alone do not account for deployment prevalence or unequal error costs, which must be considered when selecting a metric.',
        String.raw`import numpy as np
from sklearn.metrics import confusion_matrix
def binary_confusion(actual,predicted):
    a,p=np.asarray(actual),np.asarray(predicted)
    if a.ndim!=1 or a.size==0 or a.shape!=p.shape or not np.isin(a,[0,1]).all() or not np.isin(p,[0,1]).all(): raise ValueError('Aligned nonempty binary labels required')
    return confusion_matrix(a,p,labels=[0,1])`,
        String.raw`assert binary_confusion([0,0,1,1],[0,1,0,1]).tolist()==[[1,1],[1,1]]
assert binary_confusion([0,0],[0,0]).tolist()==[[2,0],[0,0]]
try: binary_confusion([0],[2])
except ValueError: pass
else: raise AssertionError('invalid class')`),
    task('Model Evaluation','Easy','macro-f1','Compare per-class and aggregate performance',
        'A three-category ticket model must be evaluated against the fixed business label set [0,1,2]. Return per-class F1 and macro-F1, assigning zero to an undefined F1. Include absent classes in the macro average. Explain why micro or accuracy can conceal a completely missed rare category.',
        'Make the class set and averaging convention explicit for imbalanced multiclass evaluation.',
        ['Use the fixed label order [0,1,2], not only labels appearing in a batch.','Return the unweighted mean of the three per-class F1 values.'],
        [['Actual [0,0,1,2], predicted [0,0,0,0]','F1 [2/3,0,0], macro-F1 2/9'],['Only actual and predicted class 0 appears','F1 [1,0,0], macro-F1 1/3']],
        ['Pass labels and zero_division explicitly.','Macro averaging weights categories equally, not in proportion to support.'],
        'F1 is the harmonic mean of precision and recall for each category. Macro-F1 highlights unequal category performance but depends on the chosen label set and can be unstable for rare classes. Always report supports and the fixed evaluation policy alongside the aggregate.',
        String.raw`import numpy as np
from sklearn.metrics import f1_score
def ticket_f1(actual,predicted):
    per_class=f1_score(actual,predicted,labels=[0,1,2],average=None,zero_division=0)
    return per_class,float(np.mean(per_class))`,
        String.raw`per,macro=ticket_f1([0,0,1,2],[0,0,0,0])
assert np.allclose(per,[2/3,0,0]) and np.isclose(macro,2/9)
assert np.isclose(ticket_f1([0],[0])[1],1/3)`),
    task('Model Evaluation','Easy','cv-baseline','Evaluate a fold-local constant baseline',
        'Before accepting a regression model, estimate a mean-prediction baseline with three shuffled KFold splits using seed 8. Fit DummyRegressor(strategy="mean") separately within each fold and return positive MAE scores. Assume at least three IID observations; do not use this split policy for grouped or temporal observations.',
        'Establish an honest fold-local regression baseline and understand sklearn scoring signs.',
        ['Use cross_val_score with neg_mean_absolute_error and negate its output.','Return exactly three nonnegative scores; each fold learns its own target mean.'],
        [['Constant targets [5,5,5,5,5,5]','All three MAEs are zero'],['Variable targets','Scores match a manual training-fold-mean calculation']],
        ['A baseline still needs to learn only from its training fold.','sklearn negates loss scores so larger scorer values are better.'],
        'Cross-validation estimates performance under the specified sampling assumptions. A training-fold mean is a useful baseline, although the median is the optimal constant for absolute loss. Repeatedly selecting models using these folds requires independent evaluation of the final selection procedure.',
        String.raw`from sklearn.dummy import DummyRegressor
from sklearn.model_selection import KFold,cross_val_score
def baseline_cv_mae(x,y):
    return -cross_val_score(DummyRegressor(strategy='mean'),x,y,cv=KFold(3,shuffle=True,random_state=8),scoring='neg_mean_absolute_error')`,
        String.raw`from sklearn.model_selection import KFold
x=np.arange(6).reshape(-1,1); y=np.array([0,1,2,8,9,10],dtype=float)
expected=[np.mean(np.abs(y[valid]-y[train].mean())) for train,valid in KFold(3,shuffle=True,random_state=8).split(x)]
assert np.allclose(baseline_cv_mae(x,y),expected)
assert np.allclose(baseline_cv_mae(x,np.full(6,5.0)),0)`),
    task('Model Evaluation','Medium','pairwise-auc','Calculate ROC-AUC with score ties',
        'Implement binary ROC-AUC as the fraction of positive-negative score pairs ranked correctly, awarding half credit for tied scores. Require both classes, aligned finite scores, and binary labels. Scores may be arbitrary finite decision scores, not just probabilities. This diagnostic implementation may use quadratic memory.',
        'Interpret ranking quality independently of a particular classification threshold.',
        ['Average pairwise wins plus half of pairwise ties.','Raise ValueError if either class is absent or score inputs are invalid.'],
        [['Labels [0,1], scores [0.5,0.5]','AUC 0.5'],['Labels [0,0,1,1], scores [0.1,0.4,0.35,0.8]','AUC 0.75']],
        ['Compare every positive score with every negative score.','High ROC-AUC does not imply calibrated probabilities or strong precision at rare deployment prevalence.'],
        'ROC-AUC is the probability that a randomly drawn positive outranks a negative, with half credit for ties. It measures ordering rather than probability calibration or threshold costs. Large datasets require an efficient rank-based implementation rather than this pairwise reference.',
        String.raw`import numpy as np
def pairwise_auc(labels,scores):
    y,s=np.asarray(labels),np.asarray(scores,dtype=float)
    if y.ndim!=1 or y.shape!=s.shape or not np.isin(y,[0,1]).all() or not np.isfinite(s).all() or set(y.tolist())!={0,1}: raise ValueError('Both binary classes and finite aligned scores required')
    pos=s[y==1][:,None]; neg=s[y==0][None,:]
    return float(np.mean((pos>neg)+0.5*(pos==neg)))`,
        String.raw`assert pairwise_auc([0,1],[0.5,0.5])==0.5
assert pairwise_auc([0,0,1,1],[0.1,0.4,0.35,0.8])==0.75
try: pairwise_auc([1,1],[0.1,0.2])
except ValueError: pass
else: raise AssertionError('single-class AUC')`),
    task('Model Evaluation','Medium','brier-score','Measure probability error with Brier score',
        'Implement the binary Brier score for a nonempty array of binary outcomes and finite positive-class probabilities in [0,1]. Return the mean squared probability error. Compare certain-correct, uncertain, and certain-wrong forecasts; explain why a Brier improvement alone is not proof of better calibration.',
        'Evaluate probability predictions while distinguishing calibration from overall probability quality.',
        ['Validate aligned binary labels and bounded finite probabilities.','Use mean squared error between probability and actual binary outcome.'],
        [['Labels [0,1], probabilities [0,1]','0.0'],['Labels [0,1], probabilities [0.5,0.5]','0.25']],
        ['Use probabilities rather than thresholded class predictions.','Brier score reflects resolution as well as calibration; inspect reliability separately.'],
        'Brier score is a proper scoring rule for binary probabilities, with lower values better. A model may improve resolution while retaining calibration problems, so a lower aggregate score does not establish calibration by itself. Compare scores on the same held-out population and against a prevalence baseline.',
        String.raw`import numpy as np
def binary_brier(labels,probabilities):
    y,p=np.asarray(labels),np.asarray(probabilities,dtype=float)
    if y.ndim!=1 or y.size==0 or y.shape!=p.shape or not np.isin(y,[0,1]).all() or not np.isfinite(p).all() or ((p<0)|(p>1)).any(): raise ValueError('Valid binary probability arrays required')
    return float(np.mean((p-y)**2))`,
        String.raw`assert binary_brier([0,1],[0,1])==0
assert binary_brier([0,1],[0.5,0.5])==0.25
assert binary_brier([0,1],[1,0])==1
try: binary_brier([1],[1.1])
except ValueError: pass
else: raise AssertionError('invalid probability')`),
    task('Model Evaluation','Medium','reliability-bins','Build a reliability table with empty bins',
        'For valid aligned binary outcomes and probabilities in [0,1], construct equal-width reliability bins. Return only nonempty bins as (bin index, count, mean probability, observed positive fraction). Use left-inclusive bins, assigning probability 1 to the final bin. Require a positive integer bin count.',
        'Inspect calibration using counts and observed frequencies rather than a single metric.',
        ['Handle probability 1 without creating an extra bin.','Skip empty bins and preserve counts so sparse bins are visible.'],
        [['Labels [0,1,1], probabilities [0,0.5,1], bins=2','(0,1,0,0) and (1,2,0.75,1)'],['All predictions 0.1 with ten bins','Only bin 1 is reported']],
        ['Use floor(p*bins) and cap at bins−1.','Small-bin observed frequencies are noisy, and bin choices can change the picture.'],
        'A reliability table compares average predicted probability with empirical event frequency within each bin. Counts are essential because sparse bins have high uncertainty. This descriptive diagnostic should use held-out predictions; it neither proves calibration nor replaces proper scoring rules.',
        String.raw`import numpy as np
def reliability_table(labels,probabilities,bins):
    y,p=np.asarray(labels),np.asarray(probabilities,dtype=float)
    if type(bins) is not int or bins<=0: raise ValueError('Positive integer bins required')
    if y.ndim!=1 or y.size==0 or y.shape!=p.shape or not np.isin(y,[0,1]).all() or not np.isfinite(p).all() or ((p<0)|(p>1)).any(): raise ValueError('Valid binary probabilities required')
    ids=np.minimum((p*bins).astype(int),bins-1)
    return [(int(k),int((ids==k).sum()),float(p[ids==k].mean()),float(y[ids==k].mean())) for k in np.unique(ids)]`,
        String.raw`assert reliability_table([0,1,1],[0,0.5,1],2)==[(0,1,0.0,0.0),(1,2,0.75,1.0)]
assert reliability_table([0,1],[0.1,0.1],10)==[(1,2,0.1,0.5)]
try: reliability_table([1],[0.5],0)
except ValueError: pass
else: raise AssertionError('invalid bin count')`),
    task('Model Evaluation','Hard','nested-evaluation','Evaluate a hyperparameter-selection procedure',
        'Implement nested cross-validation for IID regression rows. The inner three-fold search chooses Ridge alpha from [0.1,1,10] using negative MAE; scaling belongs inside the pipeline. The outer three-fold split reports positive MAE for the entire selection procedure. Use shuffled seeds 11 inner and 12 outer; return three outer losses.',
        'Separate hyperparameter selection from evaluation with nested training boundaries.',
        ['Pass GridSearchCV as the estimator to outer cross_val_score.','Keep StandardScaler inside Pipeline and propagate fit errors.'],
        [['Sixty rows with a noisy linear target','Three finite nonnegative outer MAEs'],['An outer validation fold','Its labels never choose alpha or fit scaling']],
        ['The outer loop must refit an entire inner search, not reuse a globally chosen alpha.','Nested scores assess a procedure trained on outer-training subsets; a final production model can later be selected on all development data.'],
        'Inner CV chooses model settings while outer CV supplies observations excluded from that choice. Scaling is also learned only inside each fold. Fold scores are correlated estimates rather than independent experimental replications; use a split strategy matching entities or time if IID assumptions fail.',
        String.raw`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.model_selection import KFold,GridSearchCV,cross_val_score
def nested_ridge_mae(x,y):
    pipeline=Pipeline([('scale',StandardScaler()),('model',Ridge())])
    search=GridSearchCV(pipeline,{'model__alpha':[0.1,1.0,10.0]},cv=KFold(3,shuffle=True,random_state=11),scoring='neg_mean_absolute_error',error_score='raise')
    return -cross_val_score(search,x,y,cv=KFold(3,shuffle=True,random_state=12),scoring='neg_mean_absolute_error',error_score='raise')`,
        String.raw`rng=np.random.RandomState(3); x=rng.normal(size=(60,3)); y=2*x[:,0]+rng.normal(scale=0.1,size=60)
a=nested_ridge_mae(x,y); b=nested_ridge_mae(x,y)
assert a.shape==(3,) and np.isfinite(a).all() and (a>=0).all()
assert np.allclose(a,b) and a.mean()<0.5`),
    task('Model Evaluation','Hard','cross-validated-calibration','Fit calibration without touching the final test',
        'Build a sigmoid-calibrated binary logistic model from training data only. Use a StandardScaler → LogisticRegression pipeline as the base estimator and three stratified shuffled calibration folds with seed 13. Return a fitted CalibratedClassifierCV using ensemble=True; leave final test probabilities and outcomes outside fitting.',
        'Fit preprocessing, classifier, and probability calibration with explicit held-out calibration folds.',
        ['Use CalibratedClassifierCV(estimator=base, method="sigmoid", cv=splitter, ensemble=True).','Fit only supplied training rows; require at least three examples of each class.'],
        [['Sixty balanced training rows from a separated binary problem','Finite two-column probabilities summing to one'],['Only two positive training examples','ValueError before calibration fitting']],
        ['Wrap scaling inside the estimator so each base model learns from its own training fold.','Calibration is not guaranteed to improve Brier score on every sample; assess on untouched test predictions.'],
        'Each calibration fold fits a mapping using predictions from a base model that did not train on that fold. Ensemble prediction averages the calibrated fold models. This design avoids resubstitution calibration, but final evaluation still needs an independent population with an appropriate class prevalence.',
        String.raw`import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold
def fit_calibrated_classifier(x,y):
    y=np.asarray(y)
    if y.ndim!=1 or set(y.tolist())!={0,1} or min((y==0).sum(),(y==1).sum())<3: raise ValueError('At least three rows per binary class required')
    base=Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=1000,random_state=0))])
    folds=StratifiedKFold(3,shuffle=True,random_state=13)
    return CalibratedClassifierCV(estimator=base,method='sigmoid',cv=folds,ensemble=True).fit(x,y)`,
        String.raw`x=np.linspace(-3,3,60).reshape(-1,1); y=(x[:,0]>0).astype(int)
model=fit_calibrated_classifier(x,y); p=model.predict_proba([[-2],[2]])
assert p.shape==(2,2) and np.isfinite(p).all() and np.allclose(p.sum(axis=1),1)
assert p[0,1]<p[1,1] and len(model.calibrated_classifiers_)==3
try: fit_calibrated_classifier([[0],[1],[2],[3]],[0,0,1,1])
except ValueError: pass
else: raise AssertionError('insufficient class support')`),
    task('Model Evaluation','Hard','paired-bootstrap','Quantify a paired held-out MAE difference',
        'Two frozen regression models predict the same IID held-out rows. Return the observed MAE(A)−MAE(B) and a deterministic 95% percentile bootstrap interval using 2000 paired row resamples and seed 17. Validate nonempty aligned finite vectors. Do not independently resample the two models, retrain, or use the interval to repeatedly tune against this test set.',
        'Estimate uncertainty for a paired loss difference under a stated sampling model.',
        ['Resample row-wise absolute-error differences, preserving pairing.','Return observed difference and the 2.5th/97.5th percentiles; document IID and fixed-model limitations.'],
        [['Actual [0,0,0], A [2,2,2], B [1,1,1]','Difference 1, interval [1,1]'],['Identical predictions from both models','Difference 0, interval [0,0]']],
        ['Compute per-row |y−A|−|y−B| before resampling.','For grouped or temporal rows use a suitable cluster or block bootstrap instead of an IID row bootstrap.'],
        'Pairing removes irrelevant uncertainty caused by evaluating models on different sampled rows. A positive difference favors model B. This percentile interval is approximate and conditions on already trained models; it does not include training uncertainty, model-selection effects, or dependence between observations.',
        String.raw`import numpy as np
def paired_mae_bootstrap(actual,a,b):
    y,a,b=[np.asarray(v,dtype=float) for v in (actual,a,b)]
    if y.ndim!=1 or y.size==0 or y.shape!=a.shape or y.shape!=b.shape or not all(np.isfinite(v).all() for v in (y,a,b)): raise ValueError('Aligned nonempty finite vectors required')
    differences=np.abs(y-a)-np.abs(y-b)
    rng=np.random.default_rng(17)
    means=np.array([differences[rng.integers(0,len(y),size=len(y))].mean() for _ in range(2000)])
    low,high=np.quantile(means,[0.025,0.975])
    return float(differences.mean()),(float(low),float(high))`,
        String.raw`assert paired_mae_bootstrap([0,0,0],[2,2,2],[1,1,1])==(1.0,(1.0,1.0))
assert paired_mae_bootstrap([1,2],[0,3],[0,3])==(0.0,(0.0,0.0))
assert paired_mae_bootstrap([0,1,2],[1,3,4],[0,1,2])==paired_mae_bootstrap([0,1,2],[1,3,4],[0,1,2])
try: paired_mae_bootstrap([],[],[])
except ValueError: pass
else: raise AssertionError('empty observations')`),
];
